'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { GLOBAL_EMAIL_SIGNATURE } from '@/lib/emailConfig';

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

  // 1. Generate a secure temporary password
  const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '1!';

  // 2. Create the user in Supabase Auth (bypassing the default invite email)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: tempPassword,
    email_confirm: true // Auto-confirm their email so they can log in immediately
  });
  
  if (authError) throw new Error('Failed to create user: ' + authError.message);

  if (authData?.user) {
    // 3. Insert the initial profile into the public.users table
    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      role_id: data.roleId,
      status: 'Invited',
      force_password_reset: true
    });

    if (dbError) throw new Error('User invited, but failed to construct profile: ' + dbError.message);

    // 4. Send the email via Zapier Webhook
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://saint-app.com'; // Adjust to your actual domain
    const htmlBody = `
      <p>Hi ${data.firstName},</p>
      <p>You have been invited to join the Saint App.</p>
      <p>You can log in at <a href="${appUrl}">${appUrl}</a> using the following credentials:</p>
      <ul>
        <li><strong>Email:</strong> ${data.email}</li>
        <li><strong>Temporary Password:</strong> ${tempPassword}</li>
      </ul>
      <p><strong>Important:</strong> Please update your password immediately after your first login.</p>
      <br/>
      ${GLOBAL_EMAIL_SIGNATURE}
    `;

    const webhookPayload = {
      email: data.email,
      subject: 'Your Invitation to the Saint App',
      htmlBody,
      attachments: []
    };

    const zapierWebhookUrl = process.env.ZAPIER_WEBHOOK_URL_GENERAL_EMAIL;
    if (zapierWebhookUrl) {
      await fetch(zapierWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });
    } else {
      console.warn('ZAPIER_WEBHOOK_URL_GENERAL_EMAIL is not set. Invite email was not sent.');
    }
  }

  revalidatePath('/admin/users');
}