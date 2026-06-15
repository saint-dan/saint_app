/**
 * Route: /update-password
 * Description: A standalone page where users are forced to change their temporary or expired passwords.
 */
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { updatePassword } from '../../../actions';

export const dynamic = 'force-dynamic';

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const resolvedParams = await searchParams;
  const message = resolvedParams?.message;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-12 animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="Company Logo" className="mx-auto mb-6 h-12 sm:h-16 object-contain" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Update Password
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Please enter a new, secure password to continue using your account.
          </p>
        </div>

        <form action={updatePassword} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700">New Password</label>
            <input type="password" id="password" name="password" required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" placeholder="Must be at least 6 characters" minLength={6} />
          </div>

          {message && (
            <div className="p-3 rounded-xl text-sm font-semibold text-center bg-red-50 text-red-600 border border-red-100">
              {message}
            </div>
          )}
          
          <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all">Set New Password</button>
        </form>
      </div>
    </div>
  );
}