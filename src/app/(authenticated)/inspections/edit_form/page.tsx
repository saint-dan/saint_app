/**
 * Route: /inspections/edit_form
 * Description: Server Component displaying the list of Inspection Templates available to edit.
 */
import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { ROLES } from '@/lib/constants';
import EditFormTemplatesList from '@/components/features/inspections/EditFormTemplatesList';

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
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

  // Fetch active templates
  const { data: templates } = await adminClient
    .from('inspection_templates')
    .select(`
      id,
      name,
      description,
      inspection_sections (id)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  const formattedTemplates = (templates || []).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description || '',
    sectionCount: t.inspection_sections ? t.inspection_sections.length : 0
  }));

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <EditFormTemplatesList initialTemplates={formattedTemplates} />
    </div>
  );
}