'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import React from 'react';
import { render } from '@react-email/components';
import InspectionReportEmail from '@/components/emails/InspectionReportEmail';
import { ROLES } from '@/lib/constants';

// Helper function to ensure the user is an authenticated admin
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, adminClient: null, error: 'User not authenticated' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('roles(name)')
    .eq('id', user.id)
    .single();

  // The role can be an object or an array of objects depending on the query
  const roleData = profile?.roles as any;
  const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;

  if (roleName !== ROLES.ADMIN) {
    return { user: null, adminClient: null, error: 'Unauthorized' };
  }

  const adminClient = createAdminClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  return { user, adminClient, error: null };
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  
  // Extract email and password from the submitted form
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect('/login?message=Could not authenticate user');
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard'); // Change this later to wherever users should land
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return redirect('/login?message=Could not create user');
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get('password') as string;

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect('/login?message=Not authenticated');
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    return redirect('/update-password?message=' + encodeURIComponent(updateError.message));
  }

  // Clear the force_password_reset flag and set the user status to Active
  const { error: dbError } = await supabase
    .from('users')
    .update({ 
      force_password_reset: false,
      status: 'Active' 
    })
    .eq('id', user.id);

  if (dbError) {
    return redirect('/update-password?message=' + encodeURIComponent('Password updated, but failed to activate profile. Please contact support.'));
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function saveInspection(formData: {
  inspectionId?: string;
  templateId: string;
  builderId: string;
  siteId: string;
  operativesOnSite: number;
  supervisorQualification: string;
  inspectionDate: string;
  responses: Record<string, { isCompliant: boolean | null; comments: string; photoUrls: string[] }>;
  signatures: Array<{ name: string; positionId: string; signatureData: string }>;
  status: string;
  pdfUrl?: string;
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return { success: false, error: 'User not authenticated' };
  }

  let currentInspectionId = formData.inspectionId;

  const headerPayload: any = {
      inspector_id: user.id,
      template_id: formData.templateId,
      builder_id: formData.builderId || null,
      site_id: formData.siteId || null,
      operatives_on_site: formData.operativesOnSite || null,
      supervisor_qualification: formData.supervisorQualification || null,
      status: formData.status,
      inspection_date: formData.inspectionDate
  };

  if (formData.pdfUrl) {
    headerPayload.pdf_url = formData.pdfUrl;
  }

  if (currentInspectionId) {
    const { error } = await supabase
      .from('site_inspections')
      .update(headerPayload)
      .eq('id', currentInspectionId);
    if (error) return { success: false, error: 'Failed to update inspection: ' + error.message };
  } else {
    const { data, error } = await supabase
      .from('site_inspections')
      .insert(headerPayload)
      .select()
      .single();
      
    if (error || !data) return { success: false, error: 'Failed to create inspection: ' + error?.message };
    currentInspectionId = data.id;
  }

  // 2. Refresh Checklist Responses
  if (currentInspectionId) {
    await supabase.from('inspection_responses').delete().eq('inspection_id', currentInspectionId);

    const responseRecords = Object.entries(formData.responses)
      .filter(([_, answer]) => answer.isCompliant !== null || answer.comments !== '' || answer.photoUrls.length > 0)
      .map(([questionId, answer]) => ({
        inspection_id: currentInspectionId!,
        question_id: questionId,
        is_compliant: answer.isCompliant,
        comments: answer.comments || null,
        photo_urls: answer.photoUrls || []
      }));

    if (responseRecords.length > 0) {
      const { error: responsesError } = await supabase
        .from('inspection_responses')
        .insert(responseRecords);

      if (responsesError) return { success: false, error: 'Failed to save responses: ' + responsesError.message };
    }

    // 3. Refresh Signatures
    await supabase.from('inspection_signatures').delete().eq('inspection_id', currentInspectionId);

    const validSignatures = formData.signatures.filter(s => s.name && s.signatureData);
    if (validSignatures.length > 0) {
      const signatureRecords = validSignatures.map(s => ({
        inspection_id: currentInspectionId!,
        name: s.name,
        position_id: s.positionId || null,
        signature_data: s.signatureData
      }));
      const { error: sigError } = await supabase.from('inspection_signatures').insert(signatureRecords);
      if (sigError) return { success: false, error: 'Failed to save signatures: ' + sigError.message };
    }
  }

  // 4. Send to Zapier Webhook if Completed
  if (formData.status === 'Completed') {
    try {
      const { data: profile } = await supabase.from('users').select('first_name, last_name').eq('id', user.id).single();
      
      let builderData = null;
      if (formData.builderId) {
        const { data } = await supabase.from('builders').select('name').eq('id', formData.builderId).single();
        builderData = data;
      }

      let siteData = null;
      if (formData.siteId) {
        const { data } = await supabase.from('sites').select('name').eq('id', formData.siteId).single();
        siteData = data;
      }

      const inspectorName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
      const displayDate = new Date(formData.inspectionDate).toLocaleDateString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      const subject = `Site Inspection Report - ${siteData?.name || 'N/A'} (${builderData?.name || 'N/A'})`;

      // Construct the HTML Email Body
      const htmlBody = await render(React.createElement(InspectionReportEmail, {
        inspectorName,
        siteName: siteData?.name || 'N/A',
        builderName: builderData?.name || 'N/A',
        date: displayDate
      }));

      // Prepare the payload for Zapier
      const webhookPayload = {
        subject,
        inspectorName,
        email: user.email || '',
        siteName: siteData?.name || 'N/A',
        builderName: builderData?.name || 'N/A',
        date: displayDate,
        attachments: formData.pdfUrl ? [formData.pdfUrl] : [],
        htmlBody
      };

      const zapierWebhookUrl = process.env.ZAPIER_WEBHOOK_URL_EMAILS;
      if (!zapierWebhookUrl) {
        console.error('ZAPIER_WEBHOOK_URL_EMAILS environment variable is missing.');
      } else {
        const zapierResponse = await fetch(zapierWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookPayload),
        });

        if (!zapierResponse.ok) {
          console.error('Zapier Webhook Error:', await zapierResponse.text());
        }
      }
    } catch (webhookError) {
      console.error('Failed to send payload to Zapier:', webhookError);
    }
  }

  // 5. Purge cache for the dashboard to reflect new data
  revalidatePath('/dashboard');
  revalidatePath('/inspections');
  return { success: true, inspectionId: currentInspectionId };
}

export async function createBuilder(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('builders')
    .insert({ name, is_active: true })
    .select('id, name')
    .single();

  if (error || !data) {
    return { success: false, error: 'Failed to create builder: ' + error?.message };
  }

  return { success: true, builder: data };
}

export async function createSite(name: string, builderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('sites')
    .insert({ name, builder_id: builderId, is_active: true })
    .select('id, name, builder_id')
    .single();

  if (error || !data) {
    return { success: false, error: 'Failed to create site: ' + error?.message };
  }

  return { success: true, site: data };
}

export async function createPosition(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('positions')
    .insert({ name, is_active: true })
    .select('id, name')
    .single();

  if (error || !data) {
    return { success: false, error: 'Failed to create position: ' + error?.message };
  }

  return { success: true, position: data };
}

export async function createInspectionSection(title: string, templateId: string) {
  const { adminClient, error: authError } = await requireAdmin();
  if (authError || !adminClient) {
    return { success: false, error: authError };
  }

  // Find the highest current display_order
  const { data: existing } = await adminClient
    .from('inspection_sections')
    .select('display_order')
    .eq('template_id', templateId)
    .order('display_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 1;

  const { data, error: insertError } = await adminClient
    .from('inspection_sections')
    .insert({ title, template_id: templateId, display_order: nextOrder, is_active: true } as any)
    .select()
    .single();

  if (insertError || !data) {
    return { success: false, error: 'Failed to create section: ' + insertError?.message };
  }

  revalidatePath('/inspections/edit_form', 'layout');
  return { success: true, section: data };
}

export async function updateInspectionSectionOrders(updates: { id: string; display_order: number }[], templateId: string) {
  const { adminClient, error: authError } = await requireAdmin();
  if (authError || !adminClient) {
    return { success: false, error: authError };
  }

  // Perform updates in parallel
  await Promise.all(updates.map(u => adminClient.from('inspection_sections').update({ display_order: u.display_order }).eq('id', u.id)));

  revalidatePath('/inspections/edit_form', 'layout');
  return { success: true };
}

export async function createInspectionQuestion(sectionId: string, questionText: string, responseTypeId: string, allowPhotos: boolean = false) {
  const { adminClient, error: authError } = await requireAdmin();
  if (authError || !adminClient) {
    return { success: false, error: authError };
  }

  // Find highest display_order for this section
  const { data: existing } = await adminClient
    .from('inspection_questions')
    .select('display_order')
    .eq('section_id', sectionId)
    .order('display_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 1;

  const { data, error: insertError } = await adminClient
    .from('inspection_questions')
    .insert({
      section_id: sectionId,
      question_text: questionText,
      response_type_id: responseTypeId,
      allow_photos: allowPhotos,
      display_order: nextOrder,
      is_active: true
    })
    .select(`
      id,
      question_text,
      display_order,
      allow_photos,
      response_type_id,
      response_types (name)
    `)
    .single();

  if (insertError || !data) return { success: false, error: 'Failed to create question: ' + insertError?.message };

  revalidatePath(`/inspections/edit_form/${sectionId}`);
  return { success: true, question: data };
}

export async function updateInspectionQuestionOrders(updates: { id: string; display_order: number }[], sectionId: string) {
  const { adminClient, error: authError } = await requireAdmin();
  if (authError || !adminClient) {
    return { success: false, error: authError };
  }

  await Promise.all(updates.map(u => adminClient.from('inspection_questions').update({ display_order: u.display_order }).eq('id', u.id)));

  revalidatePath(`/inspections/edit_form/${sectionId}`);
  return { success: true };
}

export async function deleteInspectionSection(sectionId: string) {
  const { adminClient, error: authError } = await requireAdmin();
  if (authError || !adminClient) {
    return { success: false, error: authError };
  }

  // We use soft-delete (is_active = false) to prevent Foreign Key constraint errors 
  // on historical inspection responses that map to questions within this section.
  const { error: deleteError } = await adminClient
    .from('inspection_sections')
    .update({ is_active: false })
    .eq('id', sectionId);

  if (deleteError) {
    return { success: false, error: 'Failed to delete section: ' + deleteError.message };
  }

  revalidatePath('/inspections/edit_form', 'layout');
  return { success: true };
}

export async function deleteInspectionQuestion(questionId: string, sectionId: string) {
  const { adminClient, error: authError } = await requireAdmin();
  if (authError || !adminClient) {
    return { success: false, error: authError };
  }

  // We use soft-delete (is_active = false) to prevent Foreign Key constraint errors 
  // on historical inspection responses that map to this question.
  const { error: deleteError } = await adminClient
    .from('inspection_questions')
    .update({ is_active: false })
    .eq('id', questionId);

  if (deleteError) {
    return { success: false, error: 'Failed to delete question: ' + deleteError.message };
  }

  revalidatePath(`/inspections/edit_form/${sectionId}`);
  return { success: true };
}

export async function deleteInspection(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  // Check the user's role to see if they are an Admin
  const { data: profile } = await supabase
    .from('users')
    .select('roles(name)')
    .eq('id', user.id)
    .single();

  const roleData = profile?.roles as any;
  const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;

  // Use the service_role client to bypass RLS if the user is an Admin
  const deleteClient = roleName === ROLES.ADMIN
    ? createAdminClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    : supabase;

  const { error } = await deleteClient
    .from('site_inspections')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: 'Failed to delete inspection: ' + error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/inspections');
  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function updateUserRole(userId: string, roleId: string) {
  const { adminClient, error: authError } = await requireAdmin();
  if (authError || !adminClient) {
    return { success: false, error: authError };
  }
  
  const { error: updateError } = await adminClient
    .from('users')
    .update({ role_id: roleId })
    .eq('id', userId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }
  
  revalidatePath('/admin/users', 'layout');
  return { success: true };
}

export async function createInspectionTemplate(name: string, description?: string) {
  const { adminClient, error: authError } = await requireAdmin();
  if (authError || !adminClient) {
    return { success: false, error: authError };
  }

  const { data, error: insertError } = await adminClient
    .from('inspection_templates')
    .insert({ name, description, is_active: true } as any)
    .select()
    .single();

  if (insertError || !data) {
    return { success: false, error: 'Failed to create template: ' + insertError?.message };
  }

  revalidatePath('/inspections/edit_form', 'layout');
  return { success: true, template: data };
}

export async function updateInspectionTemplate(id: string, updates: { name?: string; description?: string; is_active?: boolean }) {
  const { adminClient, error: authError } = await requireAdmin();
  if (authError || !adminClient) {
    return { success: false, error: authError };
  }

  const { error: updateError } = await adminClient
    .from('inspection_templates')
    .update(updates as any)
    .eq('id', id);

  if (updateError) {
    return { success: false, error: 'Failed to update template: ' + updateError.message };
  }

  revalidatePath('/inspections/edit_form', 'layout');
  return { success: true };
}

export async function deleteInspectionTemplate(id: string) {
  const { adminClient, error: authError } = await requireAdmin();
  if (authError || !adminClient) {
    return { success: false, error: authError };
  }

  // We use soft-delete (is_active = false) to prevent orphaned historical records
  const { error: deleteError } = await adminClient
    .from('inspection_templates')
    .update({ is_active: false } as any)
    .eq('id', id);

  if (deleteError) {
    return { success: false, error: 'Failed to delete template: ' + deleteError.message };
  }

  revalidatePath('/inspections/edit_form', 'layout');
  return { success: true };
}

export async function updateUserStatus(userId: string, status: string) {
  const { adminClient, error: authError } = await requireAdmin();
  if (authError || !adminClient) {
    return { success: false, error: authError };
  }
  
  const { error: updateError } = await adminClient
    .from('users')
    .update({ status: status })
    .eq('id', userId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }
  
  revalidatePath('/admin/users', 'layout');
  return { success: true };
}