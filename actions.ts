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

export async function submitInspection(formData: {
  builderId: string;
  siteId: string;
  operativesOnSite: number;
  supervisorQualification: string;
  weatherConditions: string;
  responses: Record<string, { isCompliant: boolean | null; comments: string }>;
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return { success: false, error: 'User not authenticated' };
  }

  // 1. Insert Header Record
  const { data: inspection, error: inspectionError } = await supabase
    .from('site_inspections')
    .insert({
      inspector_id: user.id,
      builder_id: formData.builderId,
      site_id: formData.siteId,
      operatives_on_site: formData.operativesOnSite,
      supervisor_qualification: formData.supervisorQualification || null,
      weather_conditions: formData.weatherConditions,
      status: 'Completed'
    })
    .select()
    .single();

  if (inspectionError || !inspection) {
    return { success: false, error: 'Failed to create inspection: ' + inspectionError?.message };
  }

  // 2. Prepare & Insert Checklist Responses
  const responseRecords = Object.entries(formData.responses).map(([questionId, answer]) => ({
    inspection_id: inspection.id,
    question_id: questionId,
    is_compliant: answer.isCompliant,
    comments: answer.comments || null
  }));

  if (responseRecords.length > 0) {
    const { error: responsesError } = await supabase
      .from('inspection_responses')
      .insert(responseRecords);

    if (responsesError) {
      return { success: false, error: 'Failed to save responses: ' + responsesError.message };
    }
  }

  // 3. Purge cache for the dashboard to reflect new data
  revalidatePath('/dashboard');
  return { success: true, inspectionId: inspection.id };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}