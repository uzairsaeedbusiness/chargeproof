import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';


export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-signature');
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (secret && signature) {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
      const signatureBuffer = Buffer.from(signature, 'utf8');

      if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
        return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    const userEmail = payload.data?.attributes?.user_email;
    const status = payload.data?.attributes?.status;
    const subscriptionId = payload.data?.id;
    const customerId = payload.data?.attributes?.customer_id;

    if (!userEmail) {
      return NextResponse.json({ received: true, note: 'No user email found' });
    }

    const supabase = await createClient();

    // 1. Locate profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (profile) {
      const isActive = eventName === 'subscription_created' || status === 'active';

      // 2. Update profile subscription record
      await supabase
        .from('profiles')
        .update({
          subscription_status: isActive ? 'active' : 'canceled',
          lemon_squeezy_customer_id: customerId ? String(customerId) : undefined,
          lemon_squeezy_subscription_id: subscriptionId ? String(subscriptionId) : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      // 3. Unlock unlimited credits
      if (isActive) {
        await supabase
          .from('usage_credits')
          .update({
            is_unlimited: true,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', profile.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Lemon Squeezy Webhook Error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
