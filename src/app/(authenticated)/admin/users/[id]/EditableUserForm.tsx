'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function EditableUserForm({ userDetails, locations, actions }: { userDetails: any, locations: any[], actions?: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const roleName = Array.isArray(userDetails.roles) ? userDetails.roles[0]?.name : userDetails.roles?.name || 'Unassigned';
  const initialLocationId = Array.isArray(userDetails.locations) ? userDetails.locations[0]?.id : userDetails.locations?.id || '';

  const [formData, setFormData] = useState({
    firstName: userDetails.first_name || '',
    lastName: userDetails.last_name || '',
    email: userDetails.email || '',
    phone: userDetails.phone || '',
    jobTitle: userDetails.job_title || '',
    qualification: userDetails.qualification || '',
    address: userDetails.address || '',
    accountType: userDetails.account_type || '',
    companyName: userDetails.company_name || '',
    companyRegNumber: userDetails.company_reg_number || '',
    nationalInsurance: userDetails.national_insurance || '',
    utrNumber: userDetails.utr_number || '',
    cisStatus: userDetails.cis_status || '',
    primaryLocationId: initialLocationId,
  });

  const formattedCreatedDate = new Date(userDetails.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        job_title: formData.jobTitle,
        qualification: formData.qualification,
        address: formData.address,
        account_type: formData.accountType,
        company_name: formData.accountType === 'Limited Company' ? formData.companyName : null,
        company_reg_number: formData.accountType === 'Limited Company' ? formData.companyRegNumber : null,
        national_insurance: formData.accountType === 'Self-Employed' ? formData.nationalInsurance : null,
        utr_number: formData.utrNumber,
        cis_status: formData.cisStatus,
        primary_location_id: formData.primaryLocationId || null,
      })
      .eq('id', userDetails.id);

    setSaving(false);
    if (error) {
      alert('Failed to update profile: ' + error.message);
    } else {
      setIsEditing(false);
      router.refresh(); // Automatically fetches the latest data on the server component
    }
  };

  const renderInput = (name: keyof typeof formData, label: string, type = 'text', isTextArea = false) => (
    <div className={`space-y-1 ${isTextArea ? 'sm:col-span-2' : ''}`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      {isEditing ? (
        isTextArea ? (
          <textarea name={name} rows={2} value={formData[name]} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm resize-none" />
        ) : (
          <input name={name} type={type} value={formData[name]} onChange={handleChange} className={`w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm ${name === 'nationalInsurance' ? 'uppercase' : ''}`} />
        )
      ) : (
        <p className={`font-medium text-slate-900 min-h-6 ${isTextArea ? 'whitespace-pre-line' : ''} ${name === 'nationalInsurance' ? 'uppercase' : ''}`}>
          {formData[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-12 relative">
      
      {/* Action Buttons */}
      <div className="absolute top-6 right-8 sm:top-10 sm:right-12 z-10 flex flex-wrap justify-end items-center gap-2 sm:gap-3">
        {actions}
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
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-sm transition-all text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

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
                {roleName}
              </span>
              <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${userDetails.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : (userDetails.status === 'Pending' || userDetails.status === 'Invited') ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                {userDetails.status || 'Pending'}
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
          {roleName === 'Fitter' && (
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
                {renderInput('utrNumber', 'UTR Number')}
                
                {renderInput('address', 'Address', 'text', true)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}