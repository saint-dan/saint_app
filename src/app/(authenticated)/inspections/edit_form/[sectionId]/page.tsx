/**
 * Route: /dashboard/inspections/edit_form/[sectionId]
 * Description: Server Component for Admin to edit questions within a specific inspection section.
 */
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { redirect } from 'next/navigation';
import EditFormQuestionsList from '@/components/features/inspections/EditFormQuestionsList';

export const dynamic = 'force-dynamic';

export default async function EditSectionQuestionsPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Check admin access
  const { data: profile } = await supabase
    .from('users')
    .select('roles(name)')
    .eq('id', user.id)
    .single();

  const roleData = profile?.roles as any;
  const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;

  if (roleName !== 'Admin') {
    redirect('/dashboard');
  }

  const resolvedParams = await params;
  const sectionId = resolvedParams.sectionId;

  const adminClient = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch the section details
  const { data: section } = await adminClient
    .from('inspection_sections')
    .select('id, title')
    .eq('id', sectionId)
    .single();

  if (!section) {
    redirect('/inspections/edit_form');
  }

  // Fetch the questions for this section
  const { data: questions } = await adminClient
    .from('inspection_questions')
    .select('id, question_text, display_order, response_type_id, response_types(name)')
    .eq('section_id', sectionId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  // Fetch available response types for the creation dropdown
  const { data: responseTypes } = await adminClient
    .from('response_types')
    .select('id, name')
    .eq('is_active', true);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <EditFormQuestionsList sectionId={section.id} sectionTitle={section.title} initialQuestions={questions || []} responseTypes={responseTypes || []} />
    </div>
  );
}