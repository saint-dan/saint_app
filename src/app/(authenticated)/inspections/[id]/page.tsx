/**
 * Route: /dashboard/inspections/[id]
 * Description: Server Component to create, view, or resume a site inspection.
 * Dynamically handles 'new' vs existing IDs.
 */
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import NewInspectionForm from '@/components/features/inspections/NewInspectionForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function InspectionFormPage(props: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  
  // Protect against direct /new navigation with no ID
  if (params.id === 'new') {
    redirect('/inspections');
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const initialResponses: Record<string, any> = {};
  let initialSignatures: any[] = [];
  let initialHeaderData = {};

  // 1. Fetch the specific inspection
  const { data: inspection } = await supabase
    .from('site_inspections')
    .select('*, inspection_templates(name)')
    .eq('id', params.id)
    .single();

  if (!inspection) {
    redirect('/inspections');
  }

  // 2. Fetch responses for this inspection
  const { data: responseRecords } = await supabase
    .from('inspection_responses')
    .select('*')
    .eq('inspection_id', params.id);

  responseRecords?.forEach(r => {
    if (r.question_id) {
      initialResponses[r.question_id] = {
        isCompliant: r.is_compliant,
        comments: r.comments || '',
        photoUrls: r.photo_urls || []
      };
    }
  });

  // 3. Fetch signatures for this inspection
  const { data: signatureRecords } = await supabase
    .from('inspection_signatures')
    .select('*')
    .eq('inspection_id', params.id);

  initialSignatures = signatureRecords?.map(s => ({
    name: s.name,
    positionId: s.position_id || '',
    signatureData: s.signature_data,
    signedAt: s.created_at
  })) || [];

  // 4. Fetch reference data (used for both New and Edit modes)
  const { data: profile } = await supabase.from('users').select('first_name, last_name, job_title, qualification').eq('id', user.id).single();
  const { data: positions } = await supabase.from('positions').select('id, name').eq('is_active', true).order('name');

  const currentTemplateId = inspection.template_id;

  // Only fetch sections and questions tied to the chosen template
  const { data: sections } = await supabase.from('inspection_sections').select('*').eq('template_id', currentTemplateId).eq('is_active', true).order('display_order');
  const sectionIds = sections?.map(s => s.id) || [];
  const { data: questions } = sectionIds.length > 0 
    ? await supabase.from('inspection_questions').select('*, response_types(code)').in('section_id', sectionIds).eq('is_active', true).order('display_order')
    : { data: [] };

  const templateData = inspection.inspection_templates as any;
  const templateName = Array.isArray(templateData) ? templateData[0]?.name : templateData?.name || 'Site Inspection Report';

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <NewInspectionForm
        profile={profile}
        sections={sections || []}
        questions={questions || []}
        positions={positions || []}
        
        // Pre-fill the form props if editing/viewing
        initialInspectionId={inspection?.id}
        initialHeaderData={initialHeaderData}
        initialResponses={initialResponses}
        initialSignatures={initialSignatures}
        initialDate={inspection?.inspection_date}
        isReadOnly={inspection?.status === 'Completed'}
        pdfUrl={inspection?.pdf_url}
        templateId={currentTemplateId}
        templateName={templateName}
      />
    </div>
  );
}