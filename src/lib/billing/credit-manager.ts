import { createClient } from '@/lib/supabase/server';

export interface CreditCheckResult {
  authorized: boolean;
  freeCreditsRemaining: number;
  isUnlimited: boolean;
  reason?: string;
}

export async function checkAndDeductCredit(userId?: string): Promise<CreditCheckResult> {
  const isDemo =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo');

  // If in demo mode without Supabase connection, allow testing with 2 demo credits
  if (isDemo || !userId) {
    return {
      authorized: true,
      freeCreditsRemaining: 2,
      isUnlimited: false,
    };
  }

  try {
    const supabase = await createClient();

    const { data: credits, error } = await supabase
      .from('usage_credits')
      .select('free_credits_remaining, is_unlimited, total_dossiers_generated')
      .eq('user_id', userId)
      .single();

    if (error || !credits) {
      return {
        authorized: false,
        freeCreditsRemaining: 0,
        isUnlimited: false,
        reason: 'Unable to verify credit balance. Please sign in.',
      };
    }

    if (credits.is_unlimited) {
      await supabase
        .from('usage_credits')
        .update({
          total_dossiers_generated: credits.total_dossiers_generated + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      return {
        authorized: true,
        freeCreditsRemaining: 999,
        isUnlimited: true,
      };
    }

    if (credits.free_credits_remaining > 0) {
      await supabase
        .from('usage_credits')
        .update({
          free_credits_remaining: credits.free_credits_remaining - 1,
          total_dossiers_generated: credits.total_dossiers_generated + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      return {
        authorized: true,
        freeCreditsRemaining: credits.free_credits_remaining - 1,
        isUnlimited: false,
      };
    }

    return {
      authorized: false,
      freeCreditsRemaining: 0,
      isUnlimited: false,
      reason: 'You have used your 2 free dispute dossiers. Upgrade to unlimited for $49/month.',
    };
  } catch (err: any) {
    return {
      authorized: false,
      freeCreditsRemaining: 0,
      isUnlimited: false,
      reason: err?.message || 'Error checking credits',
    };
  }
}
