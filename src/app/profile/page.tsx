'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [userEmail, setUserEmail] = useState('');
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  
  const [securityData, setSecurityData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    primaryLocationId: '',
    address: '',
    accountType: 'Self-Employed',
    nationalInsurance: '',
    companyName: '',
    companyRegNumber: '',
    utr: '',
    cisStatus: '20%',
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }
      
      setUserEmail(user.email || '');
      // Password fields should always start blank for security.

      // Fetch locations for the dropdown
      const { data: locationData } = await supabase
        .from('locations')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
        
      if (locationData) {
        setLocations(locationData);
      }

      // Fetch contractor profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData && !profileError) {
        setFormData({
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          phone: profileData.phone || '',
          primaryLocationId: profileData.primary_location_id || '',
          address: profileData.address || '',
          accountType: profileData.account_type || 'Self-Employed',
          nationalInsurance: profileData.national_insurance || '',
          companyName: profileData.company_name || '',
          companyRegNumber: profileData.company_reg_number || '',
          utr: profileData.utr_number || '',
          cisStatus: profileData.cis_status || '20%',
        });
      }
      
      setLoading(false);
    };

    fetchProfileData();
  }, [router, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecurityData({ ...securityData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Clean and format phone number
    const cleanPhone = formData.phone.replace(/\s+/g, '');
    const formattedPhone = cleanPhone.startsWith('07') ? '+44' + cleanPhone.slice(1) : cleanPhone;

    const { error } = await supabase
      .from('users')
      .update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formattedPhone,
        primary_location_id: formData.primaryLocationId,
        address: formData.address,
        account_type: formData.accountType,
        national_insurance: formData.accountType === 'Self-Employed' ? formData.nationalInsurance : null,
        company_name: formData.accountType === 'Limited Company' ? formData.companyName : null,
        company_reg_number: formData.accountType === 'Limited Company' ? formData.companyRegNumber : null,
        utr_number: formData.utr,
        cis_status: formData.cisStatus,
      })
      .eq('id', user.id);

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update profile: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      // Update local state with the formatted phone to reflect saved changes
      setFormData(prev => ({ ...prev, phone: formattedPhone }));
    }
    setSaving(false);
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
      // The user object in the session is updated, but we need to reflect the pending change in the UI.
      // We can't just set `userEmail` to `newEmail` because it's not confirmed yet.
      // The current approach of showing a message is best. The email in the form will reset on next page load.
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Profile Settings</h1>
            <p className="text-slate-500 font-medium mt-1">Manage your personal, professional, and tax details.</p>
          </div>
          <Link 
            href="/dashboard"
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:shadow-sm transition-all text-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Main Form Card */}
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

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Basic Information */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5">Basic Information</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-semibold text-slate-700">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-semibold text-slate-700">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={userEmail}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed outline-none shadow-sm"
                    title="Email cannot be changed here"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-semibold text-slate-700">Mobile Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Contact Details */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5">Contact Details</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="primaryLocationId" className="text-sm font-semibold text-slate-700">Primary Location</label>
                  <select
                    id="primaryLocationId"
                    name="primaryLocationId"
                    value={formData.primaryLocationId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm text-slate-700"
                    required
                  >
                    <option value="" disabled>Select your location</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-semibold text-slate-700">Full UK Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm resize-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Professional & Tax Profile */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5">Professional & Tax Profile</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="accountType" className="text-sm font-semibold text-slate-700">Type of Account</label>
                  <select
                    id="accountType"
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm text-slate-700"
                  >
                    <option value="Self-Employed">Self-Employed</option>
                    <option value="Limited Company">Limited Company</option>
                  </select>
                </div>

                {formData.accountType === 'Self-Employed' ? (
                  <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                    <label htmlFor="nationalInsurance" className="text-sm font-semibold text-slate-700">National Insurance Number</label>
                    <input
                      type="text"
                      id="nationalInsurance"
                      name="nationalInsurance"
                      value={formData.nationalInsurance}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm uppercase"
                      required={formData.accountType === 'Self-Employed'}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="space-y-2">
                      <label htmlFor="companyName" className="text-sm font-semibold text-slate-700">Company Name</label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                        required={formData.accountType === 'Limited Company'}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="companyRegNumber" className="text-sm font-semibold text-slate-700">Company Reg Number</label>
                      <input
                        type="text"
                        id="companyRegNumber"
                        name="companyRegNumber"
                        value={formData.companyRegNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                        required={formData.accountType === 'Limited Company'}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="utr" className="text-sm font-semibold text-slate-700">Unique Taxpayer Reference (UTR)</label>
                    <input
                      type="text"
                      id="utr"
                      name="utr"
                      value={formData.utr}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="cisStatus" className="text-sm font-semibold text-slate-700">CIS Tax Gross Status</label>
                    <select
                      id="cisStatus"
                      name="cisStatus"
                      value={formData.cisStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm text-slate-700"
                    >
                      <option value="20%">20% Deduction</option>
                      <option value="30%">30% Deduction</option>
                      <option value="Gross">Gross (0% Deduction)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Changes...
                  </>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Security Section */}
          <div className="mt-12 pt-8 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-5">Security & Authentication</h2>
            
            {/* Update Email Form */}
            <form onSubmit={handleEmailUpdate} className="space-y-4 mb-8">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">Change Email Address</label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    defaultValue={userEmail}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                    required
                    disabled={saving}
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto flex-shrink-0 px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Update Email'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">A confirmation will be sent to both your old and new email addresses to complete the change.</p>
              </div>
            </form>

            {/* Update Password Form */}
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Change Password</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-xs font-semibold text-slate-600">New Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={securityData.password}
                      onChange={handleSecurityChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                      placeholder="••••••••"
                      required
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-600">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={securityData.confirmPassword}
                      onChange={handleSecurityChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                      placeholder="••••••••"
                      required
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}