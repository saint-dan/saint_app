/**
 * Route: /dashboard/inspections/new
 * Description: Server Component for the New Site Inspection form. 
 * Fetches required data (builders, sites, sections, questions) and passes it to the client form.
 */
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import NewInspectionForm from '@/components/features/inspections/NewInspectionForm';

// Forces Next.js to ALWAYS fetch fresh data from Supabase for this page
export const dynamic = 'force-dynamic';

export default async function NewInspectionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // 1. Fetch user profile & job title
  const { data: profile } = await supabase
    .from('users')
    .select('first_name, last_name, job_title, qualification')
    .eq('id', user.id)
    .single();

  // 2. Fetch active builders
  const { data: builders, error: buildersError } = await supabase
    .from('builders')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  // 3. Fetch active sites
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, name, builder_id')
    .eq('is_active', true)
    .order('name');

  // 4. Fetch sections & questions
  const { data: sections, error: sectionsError } = await supabase
    .from('inspection_sections')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  const { data: questions, error: questionsError } = await supabase
    .from('inspection_questions')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  // Debugging logs to print in your VS Code terminal
  console.log("--- DB FETCH DEBUG ---");
  console.log("Builders:", builders?.length || 0, buildersError?.message || '');
  console.log("Sites:", sites?.length || 0, sitesError?.message || '');
  console.log("Sections:", sections?.length || 0, sectionsError?.message || '');
  console.log("Questions:", questions?.length || 0, questionsError?.message || '');
  console.log("----------------------");

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