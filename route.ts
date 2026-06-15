import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/dashboard';

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there is no token or the verification failed, redirect to login with an error message
  return NextResponse.redirect(`${origin}/?message=Invalid or expired link`);
}