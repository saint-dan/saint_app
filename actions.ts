'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import InspectionPDF from '@/components/features/inspections/InspectionPDF';

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
  responses: Record<string, { isCompliant: boolean | null; comments: string; photoUrls: string[] }>;
  signatures: Array<{ name: string; positionId: string; signatureData: string }>;
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
      .filter(([_, answer]) => answer.isCompliant !== null || answer.comments !== '' || answer.photoUrls.length > 0)
      .map(([questionId, answer]) => ({
        inspection_id: currentInspectionId!,
        question_id: questionId,
        is_compliant: answer.isCompliant,
        comments: answer.comments || null,
        photo_urls: answer.photoUrls || []
      }));

    if (responseRecords.length > 0) {
      const { error: responsesError } = await supabase
        .from('inspection_responses')
        .insert(responseRecords);

      if (responsesError) return { success: false, error: 'Failed to save responses: ' + responsesError.message };
    }

    // 3. Refresh Signatures
    await supabase.from('inspection_signatures').delete().eq('inspection_id', currentInspectionId);

    const validSignatures = formData.signatures.filter(s => s.name && s.signatureData);
    if (validSignatures.length > 0) {
      const signatureRecords = validSignatures.map(s => ({
        inspection_id: currentInspectionId!,
        name: s.name,
        position_id: s.positionId || null,
        signature_data: s.signatureData
      }));
      const { error: sigError } = await supabase.from('inspection_signatures').insert(signatureRecords);
      if (sigError) return { success: false, error: 'Failed to save signatures: ' + sigError.message };
    }
  }

  // 4. Generate PDF and Send to Zapier Webhook if Completed
  if (formData.status === 'Completed') {
    try {
      const { data: profile } = await supabase.from('users').select('first_name, last_name').eq('id', user.id).single();
      
      let builderData = null;
      if (formData.builderId) {
        const { data } = await supabase.from('builders').select('name').eq('id', formData.builderId).single();
        builderData = data;
      }

      let siteData = null;
      if (formData.siteId) {
        const { data } = await supabase.from('sites').select('name').eq('id', formData.siteId).single();
        siteData = data;
      }

      const { data: sections } = await supabase.from('inspection_sections').select('*').order('display_order');
      const { data: questions } = await supabase.from('inspection_questions').select('*, response_types(code)').order('display_order');
      const { data: positions } = await supabase.from('positions').select('id, name');

      const inspectorName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
      const displayDate = new Date().toLocaleDateString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      const signaturesWithNames = formData.signatures.map(sig => ({
        ...sig,
        positionName: positions?.find(p => p.id === sig.positionId)?.name || 'Signee'
      }));

      const pdfElement = React.createElement(InspectionPDF, {
        date: displayDate,
        inspectorName: inspectorName,
        builderName: builderData?.name || 'N/A',
        siteName: siteData?.name || 'N/A',
        operatives: formData.operativesOnSite || 0,
        supervisor: formData.supervisorQualification || 'N/A',
        sections: sections || [],
        questions: questions || [],
        responses: formData.responses,
        signatures: signaturesWithNames
      });

      // Cast to any to avoid strict type mismatch between @react-pdf/renderer and Resend
      const pdfBuffer = (await renderToBuffer(pdfElement as any)) as any;
      const fileName = `Saint_Inspection_${currentInspectionId}_${Date.now()}.pdf`;

      // Upload PDF to Supabase Storage
      const { error: uploadError } = await supabase
        .storage
        .from('inspection_reports')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      let pdfUrl = '';
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('inspection_reports').getPublicUrl(fileName);
        pdfUrl = urlData.publicUrl;

        // Save the URL directly to the inspection record for instant retrieval later
        await supabase
          .from('site_inspections')
          .update({ pdf_url: pdfUrl })
          .eq('id', currentInspectionId);
      } else {
        console.error('Failed to upload PDF to Supabase:', uploadError);
      }

      // Prepare the payload for Zapier
      const webhookPayload = {
        inspectorName,
        inspectorEmail: user.email || '',
        siteName: siteData?.name || 'N/A',
        builderName: builderData?.name || 'N/A',
        date: displayDate,
        pdfUrl
      };

      const zapierResponse = await fetch('https://hooks.zapier.com/hooks/catch/21574922/438bgm4/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!zapierResponse.ok) {
        console.error('Zapier Webhook Error:', await zapierResponse.text());
      }
    } catch (webhookError) {
      console.error('Failed to send payload to Zapier:', webhookError);
    }
  }

  // 5. Purge cache for the dashboard to reflect new data
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/inspections');
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

export async function createPosition(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('positions')
    .insert({ name, is_active: true })
    .select('id, name')
    .single();

  if (error || !data) {
    return { success: false, error: 'Failed to create position: ' + error?.message };
  }

  return { success: true, position: data };
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