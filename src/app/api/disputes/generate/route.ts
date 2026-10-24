import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/ai/gemini-client';
import {
  GEMINI_SYSTEM_PROMPT,
  INR_PROMPT_TEMPLATE,
  FRAUD_CE30_PROMPT_TEMPLATE,
  getMockDossier,
} from '@/lib/ai/prompts';
import { checkAndDeductCredit } from '@/lib/billing/credit-manager';
import { createClient } from '@/lib/supabase/server';
import { StructuredSummary } from '@/types/dispute';


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderNumber = 'ORD-1001',
      customerName = 'Alex Mercer',
      disputeAmount = 149.0,
      currency = 'USD',
      reasonCode = 'product_not_received',
      carrier = 'USPS Priority Mail',
      trackingNumber = '9400111899223194820192',
      deliveryStatus = 'Delivered (Front Door/Porch)',
      orderData = '',
      trackingHistory = '',
      customerEmails = '',
      storePolicy = '',
      ipAndDeviceLogs = '',
    } = body;

    // 1. Credit Check
    const creditCheck = await checkAndDeductCredit();
    if (!creditCheck.authorized) {
      return NextResponse.json(
        { error: creditCheck.reason || 'Upgrade required' },
        { status: 402 }
      );
    }

    // 2. AI Evidence Extraction
    const gemini = getGeminiClient();
    let structuredSummary: StructuredSummary;

    if (gemini) {
      try {
        const isINR = reasonCode === 'product_not_received';
        const promptContent = isINR
          ? INR_PROMPT_TEMPLATE({
              orderData: orderData || `Order: ${orderNumber}, Customer: ${customerName}, Amount: $${disputeAmount}`,
              trackingHistory: trackingHistory || `Carrier: ${carrier}, Tracking: ${trackingNumber}, Status: ${deliveryStatus}`,
              customerEmails,
              storePolicy,
            })
          : FRAUD_CE30_PROMPT_TEMPLATE({
              orderData: orderData || `Order: ${orderNumber}, Customer: ${customerName}, Amount: $${disputeAmount}`,
              ipAndDeviceLogs: ipAndDeviceLogs || 'AVS: Full Match (Y), CVV: Match (M), IP: 198.51.100.42',
              customerHistory: '',
              storePolicy,
            });

        const response = await gemini.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: promptContent,
          config: {
            systemInstruction: GEMINI_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
          },
        });

        const textOutput = response.text || '';
        structuredSummary = JSON.parse(textOutput);
      } catch (aiError) {
        console.warn('Gemini API call fell back to deterministic generator:', aiError);
        structuredSummary = getMockDossier(reasonCode, orderNumber);
      }
    } else {
      // Offline / Developer Demo Fallback
      structuredSummary = getMockDossier(reasonCode, orderNumber);
    }

    // 3. Optional Persistence to Supabase
    const disputeId = `disp_${Date.now()}`;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: dispute } = await supabase
          .from('disputes')
          .insert({
            user_id: user.id,
            order_number: orderNumber,
            customer_name: customerName,
            dispute_amount: disputeAmount,
            currency,
            reason_code: reasonCode,
            carrier,
            tracking_number: trackingNumber,
            delivery_status: deliveryStatus,
            status: 'generated',
          })
          .select('id')
          .single();

        if (dispute) {
          await supabase.from('evidence_dossiers').insert({
            dispute_id: dispute.id,
            user_id: user.id,
            structured_summary: structuredSummary,
            form_snippets: structuredSummary.stripeFormSnippets,
          });
        }
      }
    } catch {
      // Non-blocking in demo mode
    }

    return NextResponse.json({
      success: true,
      disputeId,
      orderNumber,
      customerName,
      disputeAmount,
      currency,
      reasonCode,
      carrier,
      trackingNumber,
      deliveryStatus,
      structuredSummary,
      formSnippets: structuredSummary.stripeFormSnippets,
      creditsRemaining: creditCheck.freeCreditsRemaining,
      isUnlimited: creditCheck.isUnlimited,
    });
  } catch (error: any) {
    console.error('Error generating dispute dossier:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error generating dossier' },
      { status: 500 }
    );
  }
}
