'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// Security Helper: Verify the user requesting this is an Admin
async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  const { data: profile } = await supabase.from('users').select('roles(name)').eq('id', user.id).single();
  const roleData = profile?.roles as any;
  const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;
  
  if (roleName !== 'Admin') throw new Error('Unauthorized');
  
  return user;
}

// Helper: Instantiate the service role client
function getAdminClient() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function getUserDetails(userId: string) {
  await verifyAdmin();
  const supabaseAdmin = getAdminClient();

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*, roles(name), locations(name)')
    .eq('id', userId)
    .single();

  if (error) throw new Error('Failed to fetch user details');
  return data;
}

export async function updateUserStatus(userId: string, newStatus: 'Active' | 'Rejected' | 'Pending') {
  await verifyAdmin();
  const supabaseAdmin = getAdminClient();

  const { error } = await supabaseAdmin.from('users').update({ status: newStatus }).eq('id', userId);
  if (error) throw new Error('Failed to update user status');

  // Instantly revalidate the table data to trigger an automatic UI update
  revalidatePath('/admin/users');
}

export async function inviteAdminUser(data: { firstName: string; lastName: string; email: string; roleId: string }) {
  await verifyAdmin();
  const supabaseAdmin = getAdminClient();

  // 1. Invite user via Supabase Auth Admin API (Sends the invite email)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email);
  
  if (authError) throw new Error('Failed to invite user: ' + authError.message);

  if (authData?.user) {
    // 2. Insert the initial profile into the public.users table
    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      role_id: data.roleId,
      status: 'Invited'
    });

    if (dbError) throw new Error('User invited, but failed to construct profile: ' + dbError.message);
  }

  revalidatePath('/admin/users');
}