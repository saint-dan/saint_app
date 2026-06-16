/**
 * Route: /admin/users
 * Description: Server Component displaying a list of all users in the system.
 */
import React from 'react';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import UsersTable from './UsersTable';
import InviteUserButton from './InviteUserButton';

export const dynamic = 'force-dynamic';

export interface UserRow {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  created_at: string;
  roles: any;
}

export default async function AdminUsersPage() {
  const adminClient = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: users } = await adminClient
    .from('users')
    .select('id, email, first_name, last_name, status, created_at, roles(name)')
    .order('created_at', { ascending: false });

  const { data: roles } = await adminClient.from('roles').select('id, name');
  const { data: locations } = await adminClient.from('locations').select('id, name').eq('is_active', true);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 mt-1">Manage team members, fitters, and site inspectors.</p>
        </div>
        <InviteUserButton roles={roles || []} locations={locations || []} />
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        <UsersTable users={(users as any) || []} />
      </div>
    </div>
  );
}