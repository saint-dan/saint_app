'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SecurityPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [userEmail, setUserEmail] = useState('');
  
  const [securityData, setSecurityData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }
      
      setUserEmail(user.email || '');
      setLoading(false);
    };

    fetchUserData();
  }, [router, supabase]);

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecurityData({ ...securityData, [e.target.name]: e.target.value });
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (securityData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      setSaving(false);
      return;
    }

    if (securityData.password !== securityData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      setSaving(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: securityData.password });

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update password: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setSecurityData({ password: '', confirmPassword: '' });
    }
    setSaving(false);
  };

  const handleEmailUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const newEmail = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;

    if (newEmail === userEmail) {
      setMessage({ type: 'error', text: 'The new email is the same as the current one.' });
      setSaving(false);
      return;
    }

    const { data, error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update email: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'A confirmation link has been sent to both your old and new email addresses.' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin shadow-sm">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Security & Authentication</h1>
            <p className="text-slate-500 font-medium mt-1">Manage your email address and password.</p>
          </div>
          <Link 
            href="/profile"
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:shadow-sm transition-all text-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Back to Profile
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 sm:p-10">
          
          {message && (
            <div className={`mb-8 p-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
              {message.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {message.text}
            </div>
          )}

          {/* Update Email Form */}
          <form onSubmit={handleEmailUpdate} className="space-y-4 mb-8">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">Change Email Address</label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <input type="email" id="email" name="email" defaultValue={userEmail} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm" required disabled={saving} />
                <button type="submit" disabled={saving} className="w-full sm:w-auto flex-shrink-0 px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed">
                  {saving ? 'Saving...' : 'Update Email'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">A confirmation will be sent to both your old and new email addresses to complete the change.</p>
            </div>
          </form>

          <hr className="border-slate-100 mb-8" />

          {/* Update Password Form */}
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Change Password</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-xs font-semibold text-slate-600">New Password</label>
                  <input type="password" id="password" name="password" value={securityData.password} onChange={handleSecurityChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm" placeholder="••••••••" required disabled={saving} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-600">Confirm New Password</label>
                  <input type="password" id="confirmPassword" name="confirmPassword" value={securityData.confirmPassword} onChange={handleSecurityChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm" placeholder="••••••••" required disabled={saving} />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed">
                {saving ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}