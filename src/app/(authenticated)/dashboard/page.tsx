/**
 * Route: /dashboard
 * Description: Main Dashboard Hub. Routes authenticated users to their specific 
 * role-based dashboard view (Admin, Subcontractor, Contracts Manager).
 */
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AdminView from './AdminView';
import ContractsManagerView from './ContractsManagerView';
import SubcontractorView from './SubcontractorView';

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
}

export default async function DashboardPage() {
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

  const roleData = profile?.roles;
  const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {roleName === 'Admin' && <AdminView profile={profile} />}
      {roleName === 'Subcontractor' && <SubcontractorView profile={profile} />}
      {roleName === 'Contracts Manager' && <ContractsManagerView profile={profile} />}
      
      {roleName !== 'Admin' && roleName !== 'Subcontractor' && roleName !== 'Contracts Manager' && (
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No dashboard configured</h2>
          <p className="text-slate-500">There is currently no dashboard view configured for your role.</p>
        </div>
      )}
    </div>
  );
}