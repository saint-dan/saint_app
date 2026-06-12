/**
 * Route: /dashboard/inspections/[id]
 * Description: Server Component to create, view, or resume a site inspection.
 * Dynamically handles 'new' vs existing IDs.
 */
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import NewInspectionForm from '@/components/features/inspections/NewInspectionForm';

export const dynamic = 'force-dynamic';

export default async function InspectionFormPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const isNew = params.id === 'new';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  let inspection = null;
  const initialResponses: Record<string, any> = {};
  let initialSignatures: any[] = [];
  let initialHeaderData = {
    builderId: '',
    siteId: '',
    operativesOnSite: '',
    supervisorQualification: ''
  };

  if (!isNew) {
    // 1. Fetch the specific inspection
    const { data } = await supabase
      .from('site_inspections')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!data) {
      redirect('/dashboard/inspections');
    }
    inspection = data;

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
      signatureData: s.signature_data
    })) || [];

    initialHeaderData = {
      builderId: inspection.builder_id || '',
      siteId: inspection.site_id || '',
      operativesOnSite: inspection.operatives_on_site || '',
      supervisorQualification: inspection.supervisor_qualification || ''
    };
  }

  // 4. Fetch reference data (used for both New and Edit modes)
  const { data: profile } = await supabase.from('users').select('first_name, last_name, job_title, qualification').eq('id', user.id).single();
  const { data: builders } = await supabase.from('builders').select('id, name').eq('is_active', true).order('name');
  const { data: sites } = await supabase.from('sites').select('id, name, builder_id').eq('is_active', true).order('name');
  const { data: sections } = await supabase.from('inspection_sections').select('*').eq('is_active', true).order('display_order');
  const { data: questions } = await supabase.from('inspection_questions').select('*, response_types(code)').eq('is_active', true).order('display_order');
  const { data: positions } = await supabase.from('positions').select('id, name').eq('is_active', true).order('name');

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <NewInspectionForm
        profile={profile}
        builders={builders || []}
        sites={sites || []}
        sections={sections || []}
        questions={questions || []}
        positions={positions || []}
        
        // Pre-fill the form props if editing/viewing
        initialInspectionId={inspection?.id}
        initialHeaderData={initialHeaderData}
        initialResponses={initialResponses}
        initialSignatures={initialSignatures}
        initialDate={inspection?.status === 'Completed' ? inspection?.inspection_date : undefined}
        isReadOnly={inspection?.status === 'Completed'}
      />
    </div>
  );
}