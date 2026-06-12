import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import NewInspectionForm from '@/components/features/inspections/NewInspectionForm';

export default async function NewInspectionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // 1. Fetch user profile & job title
  const { data: profile } = await supabase
    .from('users')
    .select('first_name, last_name, job_title')
    .eq('id', user.id)
    .single();

  // 2. Fetch active builders
  const { data: builders } = await supabase
    .from('builders')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  // 3. Fetch active sites
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, builder_id')
    .eq('is_active', true)
    .order('name');

  // 4. Fetch sections & questions
  const { data: sections } = await supabase
    .from('inspection_sections')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  const { data: questions } = await supabase
    .from('inspection_questions')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  return (
    <div className="max-w-4xl mx-auto">
      <NewInspectionForm
        profile={profile}
        builders={builders || []}
        sites={sites || []}
        sections={sections || []}
        questions={questions || []}
      />
    </div>
  );
}