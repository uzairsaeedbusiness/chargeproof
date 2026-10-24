import { NextRequest, NextResponse } from 'next/server';
import { generateDossierPDFBuffer } from '@/lib/pdf/render-pdf';


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderNumber = 'ORD-1001',
      disputeAmount = 149.0,
      currency = 'USD',
      reasonCode = 'product_not_received',
      customerName = 'Valued Customer',
      carrier = 'USPS Priority Mail',
      trackingNumber = '9400111899223194820192',
      deliveryStatus = 'Delivered',
      summary,
    } = body;

    if (!summary) {
      return NextResponse.json({ error: 'Missing summary payload' }, { status: 400 });
    }

    const pdfBuffer = await generateDossierPDFBuffer({
      orderNumber,
      disputeAmount,
      currency,
      reasonCode,
      customerName,
      carrier,
      trackingNumber,
      deliveryStatus,
      summary,
    });

    const uint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ChargeProof_Dossier_${orderNumber}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('PDF generation error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
