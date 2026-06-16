'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveInspection, createPosition, deleteInspection } from '../../../../actions';
import SignaturePad from '@/components/ui/SignaturePad';
import PhotoUploader from '@/components/ui/PhotoUploader';
import { createClient } from '@/utils/supabase/client';
import { pdf } from '@react-pdf/renderer';
import InspectionPDF from './InspectionPDF';

interface NewInspectionFormProps {
  profile: any;
  templateId: string;
  templateName: string;
  sections: any[];
  questions: any[];
  positions: any[];
  initialInspectionId?: string;
  initialHeaderData?: any;
  initialResponses?: any;
  initialSignatures?: any[];
  isReadOnly?: boolean;
  initialDate?: string;
  pdfUrl?: string | null;
}

export default function NewInspectionForm({
  profile,
  templateId,
  templateName,
  sections,
  questions,
  positions,
  initialInspectionId,
  initialHeaderData,
  initialResponses,
  initialSignatures,
  isReadOnly = false,
  initialDate,
  pdfUrl
}: NewInspectionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'next' | 'back' | 'submit' | 'draft' | 'add' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [inspectionId, setInspectionId] = useState<string | null>(initialInspectionId || null);
  const formRef = useRef<HTMLFormElement>(null);

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitStatusMessage, setSubmitStatusMessage] = useState<string | null>(null);

  // Auto-scroll to top when moving between sections/pages
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // State: Local Reference Data for inline creation
  const [localPositions, setLocalPositions] = useState(positions);

  const [addingPositionIndex, setAddingPositionIndex] = useState<number | null>(null);
  const [newPositionName, setNewPositionName] = useState('');
  const [isSavingPosition, setIsSavingPosition] = useState(false);

  // State: Form Header Data
  const [headerData, setHeaderData] = useState({
    inspectionDate: initialDate || new Date().toISOString().split('T')[0]
  });

  // Formatter for display
  const displayDate = new Date(headerData.inspectionDate).toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // State: Question Responses
  const [responses, setResponses] = useState<Record<string, { isCompliant: boolean | null, comments: string, photoUrls: string[] }>>(() => {
    const initial: Record<string, { isCompliant: boolean | null, comments: string, photoUrls: string[] }> = {};
    questions.forEach(q => {
      initial[q.id] = initialResponses?.[q.id] || { isCompliant: null, comments: '', photoUrls: [] };
    });
    return initial;
  });

  // State: Signatures
  const [signatures, setSignatures] = useState<Array<{ name: string; positionId: string; signatureData: string | null; signedAt?: string }>>(() => {
    if (initialSignatures && initialSignatures.length > 0) {
      return initialSignatures;
    }
    const defaultPosition = positions.find((p: any) => p.name.toLowerCase() === 'inspector') || positions.find((p: any) => p.name.toLowerCase() === profile?.job_title?.toLowerCase());
    return [{
      name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
      positionId: defaultPosition ? defaultPosition.id : '',
      signatureData: null,
      signedAt: new Date().toISOString()
    }];
  });

  // Dynamically calculate total pages based on the current number of signatures
  const totalPages = sections.length + 1 + signatures.length; // Header + Sections + Signatures Array

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setHeaderData({ ...headerData, [name]: value });
  };

  const handleResponseChange = (questionId: string, field: 'isCompliant' | 'comments' | 'photoUrls', value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], [field]: value }
    }));
  };

  const handleSignatureChange = (index: number, field: string, value: any) => {
    setSignatures(prev => {
      const newSigs = [...prev];
      newSigs[index] = { ...newSigs[index], [field]: value };
      return newSigs;
    });
  };

  const handleCreatePosition = async () => {
    if (!newPositionName.trim() || addingPositionIndex === null) return;
    setIsSavingPosition(true);
    try {
      const res = await createPosition(newPositionName);
      if (res.success && res.position) {
        setLocalPositions(prev => [...prev, res.position]);
        handleSignatureChange(addingPositionIndex, 'positionId', res.position.id);
        setAddingPositionIndex(null);
        setNewPositionName('');
      } else {
        setError(res.error || 'Failed to create position');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSavingPosition(false);
    }
  };

  const autoSaveDraft = async (overrideSignatures?: any[], actionName: 'next' | 'back' | 'draft' | 'add' = 'draft') => {
    setIsSubmitting(true);
    setLoadingAction(actionName);
    setError(null);
    try {
      const currentSignatures = overrideSignatures || signatures;
      const submissionData = {
        inspectionId: inspectionId || undefined,
        templateId,
        inspectionDate: headerData.inspectionDate,
        responses,
        signatures: currentSignatures.map(s => ({ ...s, signatureData: s.signatureData || '' })),
        status: 'Draft'
      };
      const result = await saveInspection(submissionData);
      if (result.success && result.inspectionId) {
        setInspectionId(result.inspectionId);
        return true;
      } else {
        setError(result.error || 'Failed to save draft');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      return false;
    } finally {
      setIsSubmitting(false);
      setLoadingAction(null);
    }
  };

  // Advanced Validation before navigating
  const validateCurrentPage = () => {
    setError(null);
    if (isReadOnly) return true;

    // Native HTML5 validation for inputs (this covers required text/number/date fields)
    if (formRef.current && !formRef.current.reportValidity()) {
      return false;
    }

    // Custom validation for Section Pages
    if (currentPage > 0 && currentPage <= sections.length) {
      const section = sections[currentPage - 1];
      const sectionQuestions = questions.filter(q => q.section_id === section.id);

      for (const q of sectionQuestions) {
        const resp = responses[q.id];
        const typeCode = q.response_types?.code || 'YES_NO_NA_COMMENTS';

        // Mandatory check for custom Yes/No/NA buttons
        if (q.is_mandatory && (typeCode === 'YES_NO_NA' || typeCode === 'YES_NO_NA_COMMENTS')) {
          if (resp.isCompliant === null) {
            setError(`Please answer the mandatory question: "${q.question_text}"`);
            return false;
          }
        }

        // Comments required if 'No' on YES_NO_NA_COMMENTS (mandatory or not)
        if (typeCode === 'YES_NO_NA_COMMENTS' && resp.isCompliant === false && (!resp.comments || !resp.comments.trim())) {
          setError(`Comments are required for "No" answers (see: "${q.question_text}")`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (isReadOnly) {
      setCurrentPage(prev => prev + 1);
      return;
    }
    if (!validateCurrentPage()) return;
    const saved = await autoSaveDraft(undefined, 'next');
    if (saved) setCurrentPage(prev => prev + 1);
  };

  const handleBack = async () => {
    if (isReadOnly) {
      setCurrentPage(prev => prev - 1);
      return;
    }
    await autoSaveDraft(undefined, 'back');
    setCurrentPage(prev => prev - 1);
  };

  const handleAddSignature = async () => {
    const index = currentPage - sections.length - 1;
    const currentSig = signatures[index];
    
    if (!currentSig.name.trim() || !currentSig.positionId || !currentSig.signatureData) {
      setError('Please complete the current signature before adding another.');
      return;
    }
    if (!validateCurrentPage()) return;

    const newSignatures = [...signatures, { name: '', positionId: '', signatureData: null, signedAt: new Date().toISOString() }];
    setSignatures(newSignatures);
    const saved = await autoSaveDraft(newSignatures, 'add');
    if (saved) setCurrentPage(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentPage()) return;

    if (currentPage < totalPages - 1) {
      await handleNext();
      return;
    }
    
    
    if (signatures.some(s => !s.name.trim() || !s.positionId || !s.signatureData)) {
      setError('Please complete all names, positions, and drawings for all signatures.');
      return;
    }

    setShowSubmitConfirm(true);
  };

  const executeSubmit = async () => {
    setIsSubmitting(true);
    setLoadingAction('submit');
    setError(null);
    setSubmitStatusMessage('Generating PDF report...');

    try {
      let finalPdfUrl = null;
      
      // Generate and upload PDF entirely on the client to avoid server timeout/memory issues
      const supabase = createClient();
      
      const sigsWithNames = signatures.map(sig => ({
        ...sig,
        positionName: localPositions.find(p => p.id === sig.positionId)?.name || 'Signee',
        signedAt: sig.signedAt || new Date().toISOString()
      }));

      const pdfBlob = await pdf(
        <InspectionPDF
          templateName={templateName}
          date={displayDate}
          inspectorName={`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()}
          inspectorPosition={profile?.job_title || ''}
          inspectorQualification={profile?.qualification || 'N/A'}
          sections={sections}
          questions={questions}
          responses={responses}
          signatures={sigsWithNames}
        />
      ).toBlob();

      setSubmitStatusMessage('Uploading secure document...');
      const fileName = `Saint_Inspection_${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('inspection_reports')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw new Error('Failed to upload PDF: ' + uploadError.message);

      const { data: urlData } = supabase.storage.from('inspection_reports').getPublicUrl(fileName);
      finalPdfUrl = urlData.publicUrl;

      setSubmitStatusMessage('Finalising inspection record...');
      const submissionData = {
        inspectionId: inspectionId || undefined,
        templateId,
        inspectionDate: headerData.inspectionDate,
        responses,
        signatures: signatures.map(s => ({ ...s, signatureData: s.signatureData || '' })),
        status: 'Completed',
        pdfUrl: finalPdfUrl
      };

      const result = await saveInspection(submissionData);
      if (result.success) {
        setSubmitStatusMessage('Success! Redirecting...');
        setTimeout(() => {
          router.push('/inspections?status=Completed');
        }, 1200);
      } else {
        setError(result.error || 'Failed to submit inspection');
        setIsSubmitting(false);
        setLoadingAction(null);
        setShowSubmitConfirm(false);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsSubmitting(false);
      setLoadingAction(null);
      setShowSubmitConfirm(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    const targetUrl = pdfUrl || initialHeaderData?.pdfUrl || initialHeaderData?.pdf_url;
    if (targetUrl) {
      window.open(targetUrl, '_blank');
      setIsDownloadingPdf(false);
      return;
    }
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('inspections').select('pdf_url').eq('id', inspectionId).single();
      if (!error && data?.pdf_url) {
        window.open(data.pdf_url, '_blank');
      } else {
        alert('PDF not found for this inspection. It may still be generating or was not saved correctly.');
      }
    } catch (err) {
      alert('Failed to retrieve PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDelete = async () => {
    if (!inspectionId) return;
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    const result = await deleteInspection(inspectionId);
    if (result.success) {
      router.push('/inspections?status=Completed');
    } else {
      setError(result.error || 'Failed to delete inspection');
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Page Title & Cancel Button */}
      <div className="mb-8 flex items-center justify-between px-6 sm:px-10">
        <div>
          <Link href="/inspections?status=Completed" className="text-sm font-bold text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to List
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Inspection Report
          </h1>
          <div className="mt-3 flex flex-col items-start gap-2">
            <span className={`px-3 py-1 font-bold text-xs rounded-lg border uppercase tracking-wider ${isReadOnly ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              {isReadOnly ? 'Completed' : 'Draft'}
            </span>
          </div>
        </div>
        {!isReadOnly ? (
          <div className="flex flex-wrap items-center gap-3 justify-end mt-4 sm:mt-0">
            {inspectionId && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 bg-white border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 hover:border-red-300 transition-all text-sm flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                Delete
              </button>
            )}
            <button 
              type="button"
              disabled={isSubmitting || isDeleting}
              onClick={async () => {
                await autoSaveDraft(undefined, 'draft');
                router.push('/inspections?status=Completed');
              }}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:shadow-sm transition-all text-sm flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loadingAction === 'draft' ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : 'Save Draft & Exit'}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 justify-end mt-4 sm:mt-0">
            {inspectionId && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDownloadingPdf || isDeleting}
                className="px-4 py-2 bg-white border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 hover:border-red-300 transition-all text-sm flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-4 py-2 bg-blue-50 border border-blue-100 text-blue-700 font-semibold rounded-xl hover:bg-blue-100 hover:border-blue-200 transition-all text-sm flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isDownloadingPdf ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6 flex items-center gap-4 px-6 sm:px-10">
        <div className="flex-1 flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <div key={i} className={`h-2 flex-1 rounded-full transition-colors ${i === currentPage ? 'bg-blue-600' : i < currentPage ? 'bg-blue-300' : 'bg-slate-200'}`} />
          ))}
        </div>
        <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">Step {currentPage + 1} of {totalPages}</span>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
        <fieldset disabled={isReadOnly} className="space-y-8 min-w-0 m-0 p-0 border-none group">
        {/* 1. Header Information Card */}
        {currentPage === 0 && (
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6">Inspection Details</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inspector</span>
              <p className="text-slate-900 font-semibold">{profile?.first_name} {profile?.last_name}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Position</span>
              <p className="text-slate-900 font-semibold">{profile?.job_title || 'Not specified'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qualification</span>
              <p className="text-slate-900 font-semibold">{profile?.qualification || 'None'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label htmlFor="inspectionDate" className="text-sm font-semibold text-slate-700">Inspection Date</label>
              <input
                type="date"
                id="inspectionDate"
                name="inspectionDate"
                value={headerData.inspectionDate}
                onChange={handleHeaderChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-slate-700"
                required
                disabled={isReadOnly}
              />
            </div>
          </div>
        </div>
        )}

        {/* 2. Dynamic Checklist Sections */}
          {sections.map(section => {
            const sectionPage = sections.indexOf(section) + 1;
            if (currentPage !== sectionPage) return null;

            const sectionQuestions = questions.filter(q => q.section_id === section.id);
            if (sectionQuestions.length === 0) return null;

            return (
              <div key={section.id} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
                  <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
                </div>
                
                <div className="divide-y divide-slate-100">
                  {sectionQuestions.map(q => {
                    const resp = responses[q.id];
                    // Failsafe in case a new question is added during render
                    if (!resp) return null;
                    
                    const responseTypeCode = q.response_types?.code || 'YES_NO_NA_COMMENTS';
                    const showToggle = responseTypeCode === 'YES_NO_NA_COMMENTS' || responseTypeCode === 'YES_NO_NA';
                    
                    return (
                      <div key={q.id} className="p-6 sm:px-8 flex flex-col gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                          <p className="text-slate-800 font-medium text-sm sm:text-base flex-1">
                            {q.question_text}
                            {q.is_mandatory && <span className="text-red-500 font-bold ml-1.5" title="Required">*</span>}
                          </p>
                          
                          {/* Yes / No / N-A Toggle */}
                          {showToggle && (
                          <div className="flex bg-slate-100 p-1 rounded-xl w-fit shrink-0">
                            <button
                              type="button"
                              onClick={() => handleResponseChange(q.id, 'isCompliant', true)}
                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${resp.isCompliant === true ? 'bg-white shadow-sm text-green-600' : 'text-slate-500 hover:text-slate-700'} ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResponseChange(q.id, 'isCompliant', false)}
                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${resp.isCompliant === false ? 'bg-white shadow-sm text-red-600' : 'text-slate-500 hover:text-slate-700'} ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              No
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResponseChange(q.id, 'isCompliant', null)}
                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${resp.isCompliant === null ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'} ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              N/A
                            </button>
                          </div>
                          )}
                        </div>

                        {/* Dynamic Text/Value Inputs */}
                        {responseTypeCode !== 'YES_NO_NA' && (
                          <div>
                            {responseTypeCode === 'YES_NO_NA_COMMENTS' && (
                              <input
                                type="text"
                                value={resp.comments || ''}
                                onChange={(e) => handleResponseChange(q.id, 'comments', e.target.value)}
                                placeholder="Add a comment... (Required if 'No')"
                                className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm ${resp.isCompliant === false && !resp.comments ? 'border-red-300 placeholder:text-red-300' : 'border-slate-200'}`}
                                required={resp.isCompliant === false}
                                disabled={isReadOnly}
                              />
                            )}
                            {responseTypeCode === 'FREEFORM' && (
                              <input
                                type="text"
                                value={resp.comments || ''}
                                onChange={(e) => handleResponseChange(q.id, 'comments', e.target.value)}
                                placeholder="Enter your response..."
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm"
                                disabled={isReadOnly}
                                required={q.is_mandatory}
                              />
                            )}
                            {responseTypeCode === 'DATE' && (
                              <input
                                type="date"
                                value={resp.comments || ''}
                                onChange={(e) => handleResponseChange(q.id, 'comments', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm text-slate-700"
                                disabled={isReadOnly}
                                required={q.is_mandatory}
                              />
                            )}
                            {responseTypeCode === 'INTEGER' && (
                              <input
                                type="number"
                                step="1"
                                value={resp.comments || ''}
                                onChange={(e) => handleResponseChange(q.id, 'comments', e.target.value)}
                                onBlur={(e) => {
                                  if (e.target.value) {
                                    const parsed = parseInt(e.target.value, 10);
                                    if (!isNaN(parsed)) {
                                      handleResponseChange(q.id, 'comments', parsed.toString());
                                    }
                                  }
                                }}
                                placeholder="0"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm"
                                disabled={isReadOnly}
                                required={q.is_mandatory}
                              />
                            )}
                            {(responseTypeCode === 'DECIMAL' || responseTypeCode === 'CURRENCY') && (
                              <div className="relative">
                                {responseTypeCode === 'CURRENCY' && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">£</span>}
                                <input
                                  type="number"
                                  step="0.01"
                                  value={resp.comments || ''}
                                  onChange={(e) => handleResponseChange(q.id, 'comments', e.target.value)}
                                  onBlur={(e) => {
                                    if (e.target.value) {
                                      const parsed = parseFloat(e.target.value);
                                      if (!isNaN(parsed)) {
                                        handleResponseChange(q.id, 'comments', parsed.toFixed(2));
                                      }
                                    }
                                  }}
                                  placeholder="0.00"
                                  className={`w-full pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm ${responseTypeCode === 'CURRENCY' ? 'pl-8' : 'px-4'}`}
                                  disabled={isReadOnly}
                                  required={q.is_mandatory}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Photo Evidence Upload */}
                        {q.allow_photos && (
                          <div className="mt-2">
                            <PhotoUploader 
                              urls={resp.photoUrls || []} 
                              onChange={(urls) => handleResponseChange(q.id, 'photoUrls', urls)} 
                              disabled={isReadOnly} 
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

        {/* 3. Signatures Section */}
        {currentPage > sections.length && (
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6">
              Signatures {signatures.length > 1 ? `(${currentPage - sections.length} of ${signatures.length})` : ''}
            </h2>
            
            <div className="space-y-8 mb-8">
              {(() => {
                const index = currentPage - sections.length - 1;
                const sig = signatures[index];
                if (!sig) return null;

                return (
                  <div key={index} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                    {signatures.length > 1 && !isReadOnly && (
                      <div className="flex justify-end mb-4">
                        <button
                          type="button"
                          onClick={async () => {
                            const newSigs = signatures.filter((_, i) => i !== index);
                            setSignatures(newSigs);
                            setCurrentPage(prev => prev - 1);
                            await autoSaveDraft(newSigs);
                          }}
                          className="text-red-500 hover:text-red-700 font-semibold text-sm transition-colors flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Full Name</label>
                        <input
                          type="text"
                          value={sig.name}
                          onChange={(e) => handleSignatureChange(index, 'name', e.target.value)}
                          placeholder="Enter full name..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm"
                          required
                          disabled={isReadOnly}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-semibold text-slate-700">Position</label>
                          {!isReadOnly && addingPositionIndex !== index && (
                            <button type="button" onClick={() => setAddingPositionIndex(index)} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                              + Add New
                            </button>
                          )}
                        </div>
                        {addingPositionIndex === index ? (
                          <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-200">
                            <input
                              type="text"
                              value={newPositionName}
                              onChange={(e) => setNewPositionName(e.target.value)}
                              placeholder="Position Title..."
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm"
                              autoFocus
                            />
                            <button type="button" onClick={handleCreatePosition} disabled={isSavingPosition} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 shrink-0">
                              {isSavingPosition ? '...' : 'Save'}
                            </button>
                            <button type="button" onClick={() => setAddingPositionIndex(null)} disabled={isSavingPosition} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors shrink-0">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <select
                            value={sig.positionId}
                            onChange={(e) => handleSignatureChange(index, 'positionId', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-slate-700 text-sm"
                            required
                            disabled={isReadOnly}
                          >
                            <option value="" disabled>Select Position...</option>
                            {localPositions.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Signature</label>
                      <SignaturePad
                        initialValue={sig.signatureData}
                        onChange={(val) => handleSignatureChange(index, 'signatureData', val)}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        </fieldset>

        {/* 4. Submit Area */}
        <div className="flex justify-between items-center gap-4 mt-2">
          <div className="flex items-center">
            {currentPage > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingAction === 'back' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Back'}
              </button>
            ) : !isReadOnly && (
              <button
                type="button"
                onClick={() => router.push('/inspections?status=Completed')}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-600 hover:text-red-600 font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            {error && <p className="text-red-500 font-medium text-sm text-center sm:text-right">{error}</p>}
            
            {currentPage < totalPages - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingAction === 'next' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Next'}
              </button>
            ) : (!isReadOnly && (
              <>
              <button
                type="button"
                onClick={handleAddSignature}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingAction === 'add' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : '+ Add Another'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingAction === 'submit' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : 'Submit'}
              </button>
              </>
            ))}
          </div>
          </div>
      </form>

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowDeleteConfirm(false)}
          />
          
          <div className="relative bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 w-full max-w-md p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6 shadow-inner border border-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Delete Inspection?</h3>
              <p className="text-slate-500 font-medium mb-8">
                Are you sure you want to delete this inspection? This action cannot be undone and will permanently remove the data.
              </p>
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => !isSubmitting && setShowSubmitConfirm(false)}
          />
          
          <div className="relative bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 w-full max-w-md p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            {isSubmitting ? (
              <div className="flex flex-col items-center text-center py-6">
                {submitStatusMessage?.includes('Success') ? (
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6 shadow-inner border border-green-100 animate-in zoom-in duration-300">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center mb-6">
                    <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">Processing</h3>
                <p className="text-slate-500 font-medium">{submitStatusMessage}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-6 shadow-inner border border-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Finish Report?</h3>
                <p className="text-slate-500 font-medium mb-8">
                  Are you sure you have finished? Once submitted, the report will be saved and cannot be changed.
                </p>
                <div className="flex w-full gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSubmitConfirm(false)}
                    className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl transition-colors shadow-sm"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={executeSubmit}
                    className="flex-1 py-3.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    Yes, Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}