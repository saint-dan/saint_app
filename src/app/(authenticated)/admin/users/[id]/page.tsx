/**
 * Route: /admin/users/[id]
 * Description: Server Component to view full user profile details.
 */
import React from 'react';
import Link from 'next/link';
import { getUserDetails } from '../actions';
import { redirect } from 'next/navigation';
import StatusButtons from './StatusButtons';
import EditableUserForm from './EditableUserForm';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function UserProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const userDetails = await getUserDetails(params.id);

  if (!userDetails) {
    redirect('/admin/users');
  }

  const supabase = await createClient();
  const { data: locations } = await supabase.from('locations').select('id, name').eq('is_active', true);

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
        <EditableUserForm userDetails={userDetails} locations={locations || []} />
      </div>
    </div>
  );
}
