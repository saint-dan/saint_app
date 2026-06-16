'use client';

/**
 * Route: /profile
 * Description: Client Component for the user profile page. Allows users to view
 * and edit their basic information and role-specific details.
 */
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [userRole, setUserRole] = useState('');
  const [userStatus, setUserStatus] = useState('Pending');
  const [createdAt, setCreatedAt] = useState('');
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    primaryLocationId: '',
    address: '',
    accountType: 'Self-Employed',
    nationalInsurance: '',
    companyName: '',
    companyRegNumber: '',
    utr: '',
    cisStatus: '20%',
    qualification: '',
    jobTitle: '',
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }
      
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
        .select('*, roles(name)')
        .eq('id', user.id)
        .single();

      if (profileData && !profileError) {
        setFormData({
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          email: profileData.email || user.email || '',
          phone: profileData.phone || '',
          primaryLocationId: profileData.primary_location_id || '',
          address: profileData.address || '',
          accountType: profileData.account_type || 'Self-Employed',
          nationalInsurance: profileData.national_insurance || '',
          companyName: profileData.company_name || '',
          companyRegNumber: profileData.company_reg_number || '',
          utr: profileData.utr_number || '',
          cisStatus: profileData.cis_status || '20%',
          qualification: profileData.qualification || '',
          jobTitle: profileData.job_title || '',
        });

        const roleData = profileData.roles;
        const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;
        if (roleName) setUserRole(roleName);
        setUserStatus(profileData.status || 'Pending');
        setCreatedAt(profileData.created_at || '');
      }
      
      setLoading(false);
    };

    fetchProfileData();
  }, [router, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let emailUpdateMsg = '';
    if (formData.email !== user.email) {
      const { error: authError } = await supabase.auth.updateUser({ email: formData.email });
      if (authError) {
        setMessage({ type: 'error', text: 'Failed to update email: ' + authError.message });
        setSaving(false);
        return;
      }
      emailUpdateMsg = ' A confirmation link has been sent to your new email address.';
    }

    // Clean and format phone number
    const cleanPhone = formData.phone.replace(/\s+/g, '');
    const formattedPhone = cleanPhone.startsWith('07') ? '+44' + cleanPhone.slice(1) : cleanPhone;

    const { error } = await supabase
      .from('users')
      .update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formattedPhone,
        primary_location_id: formData.primaryLocationId,
        address: formData.address,
        account_type: formData.accountType,
        national_insurance: formData.accountType === 'Self-Employed' ? formData.nationalInsurance : null,
        company_name: formData.companyName,
        company_reg_number: formData.accountType === 'Limited Company' ? formData.companyRegNumber : null,
        utr_number: formData.utr,
        cis_status: formData.cisStatus,
        qualification: formData.qualification || null,
        job_title: formData.jobTitle || null,
      })
      .eq('id', user.id);

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update profile: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' + emailUpdateMsg });
      // Update local state with the formatted phone to reflect saved changes
      setFormData(prev => ({ ...prev, phone: formattedPhone }));
      setIsEditing(false);
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

  const formattedCreatedDate = createdAt ? new Date(createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : '';

  const renderInput = (name: keyof typeof formData, label: string, type = 'text', isTextArea = false) => (
    <div className={`space-y-1 ${isTextArea ? 'sm:col-span-2' : ''}`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      {isEditing ? (
        isTextArea ? (
          <textarea name={name} rows={2} value={formData[name] as string} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm resize-none" />
        ) : (
          <input name={name} type={type} value={formData[name] as string} onChange={handleChange} className={`w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm ${name === 'nationalInsurance' ? 'uppercase' : ''}`} />
        )
      ) : (
        <p className={`font-medium text-slate-900 min-h-6 ${isTextArea ? 'whitespace-pre-line' : ''} ${name === 'nationalInsurance' ? 'uppercase' : ''}`}>
          {formData[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 sm:px-12">
          <div>
            <Link 
              href="/dashboard"
              className="text-sm font-bold text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Profile</h1>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-12 relative">
          
          {/* Action Buttons */}
          <div className="absolute top-6 right-8 sm:top-10 sm:right-12 z-10 flex flex-wrap justify-end items-center gap-2 sm:gap-3">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 shadow-sm transition-all text-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl border border-slate-200 transition-all text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-sm transition-all text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
          
          {message && (
            <div className={`mt-16 sm:mt-12 mb-8 p-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
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

          <div className="space-y-10 mt-6 sm:mt-0">
            
            {/* Overview Header */}
            <div className="flex items-center gap-5 pb-8 border-b border-slate-100 pr-0 lg:pr-[450px]">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 text-3xl font-bold border-4 border-white shadow-sm shrink-0">
                {formData.firstName?.charAt(0)}{formData.lastName?.charAt(0)}
              </div>
              <div>
                {isEditing ? (
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <input name="firstName" value={formData.firstName} onChange={handleChange} className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900" placeholder="First Name" />
                    <input name="lastName" value={formData.lastName} onChange={handleChange} className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900" placeholder="Last Name" />
                  </div>
                ) : (
                  <h3 className="text-2xl font-bold text-slate-900">{formData.firstName} {formData.lastName}</h3>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                    {userRole || 'Unassigned'}
                  </span>
                  <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${userStatus === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : (userStatus === 'Pending' || userStatus === 'Invited') ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {userStatus || 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-10">
              
              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5">Basic Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Created</p>
                    <p className="font-medium text-slate-900 min-h-6">{formattedCreatedDate}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Primary Location</p>
                    {isEditing ? (
                      <select name="primaryLocationId" value={formData.primaryLocationId} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-700">
                        <option value="">Select Location...</option>
                        {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                      </select>
                    ) : (
                      <p className="font-medium text-slate-900 min-h-6">{locations.find(l => l.id === formData.primaryLocationId)?.name || ''}</p>
                    )}
                  </div>

                  {renderInput('email', 'Email Address', 'email')}

                  {renderInput('phone', 'Mobile Number', 'tel')}
                  {renderInput('jobTitle', 'Job Title')}
                  
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Qualification</p>
                    {isEditing ? (
                      <select name="qualification" value={formData.qualification} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-700">
                        <option value="">None</option>
                        <option value="SSSTS">SSSTS</option>
                        <option value="SMSTS">SMSTS</option>
                      </select>
                    ) : (
                      <p className="font-medium text-slate-900 min-h-6">{formData.qualification}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Fitter Details */}
              {(userRole === 'Fitter' || userRole === 'Subcontractor') && (
                <div>
                  <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5">Fitter Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Type</p>
                      {isEditing ? (
                        <select name="accountType" value={formData.accountType} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-700">
                          <option value="">None Selected</option>
                          <option value="Self-Employed">Self-Employed</option>
                          <option value="Limited Company">Limited Company</option>
                          <option value="Saint Employee">Saint Employee</option>
                        </select>
                      ) : (
                        <p className="font-medium text-slate-900 min-h-6">{formData.accountType}</p>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CIS Status</p>
                      {isEditing ? (
                        <select name="cisStatus" value={formData.cisStatus} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-700">
                          <option value="">None Selected</option>
                          <option value="20%">20% Deduction</option>
                          <option value="30%">30% Deduction</option>
                          <option value="Gross">Gross (0% Deduction)</option>
                        </select>
                      ) : (
                        <p className="font-medium text-slate-900 min-h-6">{formData.cisStatus}</p>
                      )}
                    </div>

                    {renderInput('companyName', 'Company Name')}
                    {renderInput('companyRegNumber', 'Reg Number')}
                    {renderInput('nationalInsurance', 'National Insurance')}
                    {renderInput('utr', 'UTR Number')}
                    
                    {renderInput('address', 'Address', 'text', true)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}