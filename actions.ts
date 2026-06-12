'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

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

export async function saveInspection(formData: {
  inspectionId?: string;
  builderId: string;
  siteId: string;
  operativesOnSite: number;
  supervisorQualification: string;
  responses: Record<string, { isCompliant: boolean | null; comments: string }>;
  status: string;
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return { success: false, error: 'User not authenticated' };
  }

  let currentInspectionId = formData.inspectionId;

  const headerPayload = {
      inspector_id: user.id,
      builder_id: formData.builderId || null,
      site_id: formData.siteId || null,
      operatives_on_site: formData.operativesOnSite || null,
      supervisor_qualification: formData.supervisorQualification || null,
      status: formData.status,
      inspection_date: new Date().toISOString().split('T')[0]
  };

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
      .filter(([_, answer]) => answer.isCompliant !== null || answer.comments !== '')
      .map(([questionId, answer]) => ({
        inspection_id: currentInspectionId!,
        question_id: questionId,
        is_compliant: answer.isCompliant,
        comments: answer.comments || null
      }));

    if (responseRecords.length > 0) {
      const { error: responsesError } = await supabase
        .from('inspection_responses')
        .insert(responseRecords);

      if (responsesError) return { success: false, error: 'Failed to save responses: ' + responsesError.message };
    }
  }

  // 3. Purge cache for the dashboard to reflect new data
  revalidatePath('/dashboard');
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

export async function deleteInspection(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const { error } = await supabase
    .from('site_inspections')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: 'Failed to delete inspection: ' + error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/inspections');
  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}