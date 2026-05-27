import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import UsersTable from './UsersTable';

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

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        
        {/* Breadcrumb / Back Link */}
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="p-8 sm:px-10 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Users</h1>
              <p className="text-slate-500 font-medium mt-2">Manage all registered users.</p>
            </div>
          </div>

          <UsersTable users={users} />
        </div>
      </main>
    </div>
  );
}