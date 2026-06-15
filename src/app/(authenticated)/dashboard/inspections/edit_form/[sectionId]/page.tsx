/**
 * Route: /dashboard/inspections/edit_form
 * Description: Server Component for Admin to edit the inspection form template (sections, questions).
 */
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { redirect } from 'next/navigation';
import EditFormSectionsList from '@/components/features/inspections/EditFormSectionsList';

export const dynamic = 'force-dynamic';

export default async function EditFormPage() {
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

  // Use the admin client to bypass RLS and fetch all sections + question references
  const adminClient = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: sections } = await adminClient
    .from('inspection_sections')
    .select('id, title, display_order, inspection_questions(id)')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const formattedSections = (sections || []).map(section => ({
    id: section.id,
    title: section.title,
    display_order: section.display_order,
    questionCount: section.inspection_questions?.length || 0
  }));

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <EditFormSectionsList initialSections={formattedSections} />
    </div>
  );
}