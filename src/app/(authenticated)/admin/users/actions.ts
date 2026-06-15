'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import React from 'react';
import { render } from '@react-email/components';
import InviteUserEmail from '@/components/emails/InviteUserEmail';

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

export async function inviteAdminUser(data: { firstName: string; lastName: string; email: string; phone?: string; roleId: string; primaryLocationId: string }) {
  await verifyAdmin();
  const supabaseAdmin = getAdminClient();

  // Helper to dynamically get the correct URL based on the environment (Local vs Vercel)
  const getSiteUrl = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ??
      process?.env?.NEXT_PUBLIC_VERCEL_URL ??
      'http://localhost:3000';
    url = url.includes('http') ? url : `https://${url}`;
    url = url.endsWith('/') ? url.slice(0, -1) : url;
    return url;
  };
  const appUrl = getSiteUrl();

  // 1. Generate an invite link (Creates the user and returns a secure magic link)
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'invite',
    email: data.email
  });
  
  if (linkError) throw new Error('Failed to create user/invite link: ' + linkError.message);

  const authUser = linkData.user;
  const hashedToken = linkData.properties.hashed_token;
  const actionLink = `${appUrl}/auth/confirm?token_hash=${hashedToken}&type=invite&next=/dashboard`;

  if (authUser) {
    // 2. Insert the initial profile into the public.users table
    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: authUser.id,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      role_id: data.roleId,
      primary_location_id: data.primaryLocationId,
      phone: data.phone || null,
      status: 'Invited',
      force_password_reset: true
    });

    if (dbError) throw new Error('User invited, but failed to construct profile: ' + dbError.message);

    // 3. Send the email via Zapier Webhook
    
    const htmlBody = await render(React.createElement(InviteUserEmail, {
      firstName: data.firstName,
      actionLink
    }));

    const webhookPayload = {
      email: data.email,
      subject: 'Your Invitation to the Saint App',
      htmlBody,
      attachments: []
    };

    const zapierWebhookUrl = process.env.ZAPIER_WEBHOOK_URL_EMAILS;
    if (zapierWebhookUrl) {
      const zapierResponse = await fetch(zapierWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });

      if (!zapierResponse.ok) {
        console.error('Zapier Webhook Error:', await zapierResponse.text());
      }
    } else {
      console.warn('ZAPIER_WEBHOOK_URL_EMAILS is not set. Invite email was not sent.');
    }
  }

  revalidatePath('/admin/users');
}