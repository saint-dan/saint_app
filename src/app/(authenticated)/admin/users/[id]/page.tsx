/**
 * Route: /admin/users/[id]
 * Description: Server Component to view full user profile details.
 */
import React from 'react';
import Link from 'next/link';
import { getUserDetails } from '../actions';
import { redirect } from 'next/navigation';
import StatusButtons from './StatusButtons';

export const dynamic = 'force-dynamic';

export default async function UserProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const userDetails = await getUserDetails(params.id);

  if (!userDetails) {
    redirect('/admin/users');
  }

  const roleName = Array.isArray(userDetails.roles) ? userDetails.roles[0]?.name : userDetails.roles?.name || 'Unassigned';
  const locationName = Array.isArray(userDetails.locations) ? userDetails.locations[0]?.name : userDetails.locations?.name || '';

  const formattedCreatedDate = new Date(userDetails.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 sm:px-12">
          <div>
            <Link 
              href="/admin/users"
              className="text-sm font-bold text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Users
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">User Profile</h1>
            <p className="text-slate-500 font-medium mt-1">View and manage user details.</p>
          </div>
          
          {/* Status Buttons for Pending Users */}
          {userDetails.status === 'Pending' && (
            <StatusButtons userId={userDetails.id} />
          )}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-12">
          <div className="space-y-10">
            
            {/* Overview */}
            <div className="flex items-center gap-5 pb-8 border-b border-slate-100">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 text-3xl font-bold border-4 border-white shadow-sm shrink-0">
                {userDetails.first_name?.charAt(0)}{userDetails.last_name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{userDetails.first_name} {userDetails.last_name}</h3>
                <div className="mt-2 flex items-center gap-3">
                  <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                    {roleName}
                  </span>
                  <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${userDetails.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : userDetails.status === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {userDetails.status || 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Contact Info */}
              <div>
                <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5">Contact Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Primary Location</p>
                    <p className="font-medium text-slate-900 min-h-6">{locationName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</p>
                    <p className="font-medium text-slate-900 min-h-6">{userDetails.email || ''}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mobile Number</p>
                    <p className="font-medium text-slate-900 min-h-6">{userDetails.phone || ''}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Title</p>
                    <p className="font-medium text-slate-900 min-h-6">{userDetails.job_title || ''}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Qualification</p>
                    <p className="font-medium text-slate-900 min-h-6">{userDetails.qualification || ''}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Created</p>
                    <p className="font-medium text-slate-900 min-h-6">{formattedCreatedDate}</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Address</p>
                    <p className="font-medium text-slate-900 whitespace-pre-line min-h-6">{userDetails.address || ''}</p>
                  </div>
                </div>
              </div>

              {/* Tax & Business Profile */}
              <div>
                <h4 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5">Contractor Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Type</p>
                    <p className="font-medium text-slate-900 min-h-6">{userDetails.account_type || ''}</p>
                  </div>
                  
                  {userDetails.account_type === 'Limited Company' ? (
                    <>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Company Name</p>
                        <p className="font-medium text-slate-900 min-h-6">{userDetails.company_name || ''}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reg Number</p>
                        <p className="font-medium text-slate-900 min-h-6">{userDetails.company_reg_number || ''}</p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">National Insurance</p>
                      <p className="font-medium text-slate-900 uppercase min-h-6">{userDetails.national_insurance || ''}</p>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">UTR Number</p>
                    <p className="font-medium text-slate-900 min-h-6">{userDetails.utr_number || ''}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CIS Status</p>
                    <p className="font-medium text-slate-900 min-h-6">{userDetails.cis_status || ''}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
