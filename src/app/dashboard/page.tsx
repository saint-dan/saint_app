import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DashboardHeader from './DashboardHeader';
import AdminView from './AdminView';
import ContractorView from './ContractorView';

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: string;
  roles?: { name: string } | { name: string }[] | null;
  status: string;
}

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, roles(name)')
    .eq('id', user.id)
    .single();

  // Safely extract the role name, handling both object and array formats from Supabase
  const roleData = profile?.roles;
  const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader email={user.email} profile={profile} />

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {roleName === 'Admin' && <AdminView profile={profile} />}
        
        {roleName === 'Contractor' && <ContractorView profile={profile} />}
        
        {/* Fallback for any newly added roles down the line */}
        {roleName !== 'Admin' && roleName !== 'Contractor' && (
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-12 text-center">
            <h2 className="text-2xl font-bold text-slate-800">No dashboard configured</h2>
            <p className="text-slate-500 mt-2">There is currently no dashboard view configured for the role: <strong>{roleName || 'None'}</strong>.</p>
            
            {/* Debug information to help us see what Supabase is actually returning */}
            <div className="mt-8 p-4 bg-slate-50 rounded-xl text-left overflow-auto text-xs text-slate-700 max-w-2xl mx-auto border border-slate-200">
              <p className="font-bold mb-2 text-slate-900">Debug Profile Data:</p>
              <pre>{JSON.stringify(profile, null, 2)}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}