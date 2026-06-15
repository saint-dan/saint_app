import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import UsersTable from './UsersTable';
import InviteUserButton from './InviteUserButton';

export type RoleData = { name: string } | { name: string }[] | null | undefined;

export interface UserRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  created_at: string;
  roles: RoleData;
}

export default async function UsersPage() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/');
  }

  // Verify that the current user has the 'Admin' role
  const { data: currentUserProfile } = await supabase
    .from('users')
    .select('roles(name)')
    .eq('id', user.id)
    .single();
    
  const currentUserRoleData = currentUserProfile?.roles as RoleData;
  const currentUserRole = Array.isArray(currentUserRoleData) 
    ? currentUserRoleData[0]?.name 
    : currentUserRoleData?.name;

  if (currentUserRole !== 'Admin') {
    redirect('/dashboard');
  }

  // Use the service_role key to bypass Row Level Security (RLS) so the admin can see all users
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all users with their roles assigned
  const { data: rawUsers } = await supabaseAdmin
    .from('users')
    .select(`
      id,
      first_name,
      last_name,
      status,
      created_at,
      roles(name)
    `)
    .order('created_at', { ascending: false });

  const users = rawUsers as UserRow[] | null;

  // Fetch available roles for the invite modal
  const { data: roles } = await supabaseAdmin.from('roles').select('id, name').order('name');

  // Fetch available locations for the invite modal
  const { data: locations } = await supabaseAdmin.from('locations').select('id, name').eq('is_active', true).order('name');

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 sm:px-10">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Users</h1>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <InviteUserButton roles={roles || []} locations={locations || []} />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <UsersTable users={users} />
        </div>
      </div>
    </div>
  );
}