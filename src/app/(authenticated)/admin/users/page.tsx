import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

type RoleData = { name: string } | { name: string }[] | null | undefined;

interface UserRow {
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

  // Fetch all users with their roles assigned
  const { data: rawUsers } = await supabase
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
              <p className="text-slate-500 font-medium mt-2">Manage all registered users and contractors.</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="py-4 px-8 sm:px-10 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="py-4 px-8 sm:px-10 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="py-4 px-8 sm:px-10 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-8 sm:px-10 text-xs font-bold text-slate-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users?.map((u: UserRow) => {
                  const roleData = u.roles;
                  const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;
                  
                  const statusStyle = u.status === 'Active' 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : u.status === 'Pending'
                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-5 px-8 sm:px-10">
                        <div className="font-bold text-slate-900">{u.first_name} {u.last_name}</div>
                      </td>
                      <td className="py-5 px-8 sm:px-10">
                        <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {roleName || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-5 px-8 sm:px-10">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusStyle}`}>
                          {u.status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-5 px-8 sm:px-10 text-sm font-medium text-slate-500">
                        {new Date(u.created_at).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  );
                })}
                {(!users || users.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 font-medium">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}