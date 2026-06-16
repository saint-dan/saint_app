/**
 * Route: /inspections/edit_form/[templateId]
 * Description: Server Component displaying sections filtered by a specific Template.
 */
import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { ROLES } from '@/lib/constants';
import EditFormSectionsList from '@/components/features/inspections/EditFormSectionsList';

export const dynamic = 'force-dynamic';

export default async function SectionsPage({ params }: { params: Promise<{ templateId: string }> }) {
  const resolvedParams = await params;
  const { templateId } = resolvedParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: profile } = await supabase.from('users').select('roles(name)').eq('id', user.id).single();
  const roleData = profile?.roles as any;
  const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;

  if (roleName !== ROLES.ADMIN) redirect('/dashboard');

  const adminClient = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch template details
  const { data: template } = await adminClient
    .from('inspection_templates')
    .select('name')
    .eq('id', templateId)
    .single();

  if (!template) redirect('/inspections/edit_form');

  // Fetch sections for this template
  const { data: sections } = await adminClient
    .from('inspection_sections')
    .select(`
      id,
      title,
      display_order,
      inspection_questions(id, is_active)
    `)
    .eq('template_id', templateId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const formattedSections = (sections || []).map(s => {
    const activeQuestions = s.inspection_questions?.filter((q: any) => q.is_active !== false) || [];
    return {
      id: s.id,
      title: s.title,
      display_order: s.display_order,
      questionCount: activeQuestions.length
    };
  });

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <EditFormSectionsList 
        initialSections={formattedSections} 
        templateId={templateId}
        templateName={template.name}
      />
    </div>
  );
}