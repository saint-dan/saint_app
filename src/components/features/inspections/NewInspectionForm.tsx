'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveInspection, createBuilder, createSite, createPosition } from '../../../../actions';
import SignaturePad from '@/components/ui/SignaturePad';
import PhotoUploader from '@/components/ui/PhotoUploader';

interface NewInspectionFormProps {
  profile: any;
  builders: any[];
  sites: any[];
  sections: any[];
  questions: any[];
  positions: any[];
  initialInspectionId?: string;
  initialHeaderData?: any;
  initialResponses?: any;
  initialSignatures?: any[];
  isReadOnly?: boolean;
  initialDate?: string;
}

export default function NewInspectionForm({
  profile,
  builders,
  sites,
  sections,
  questions,
  positions,
  initialInspectionId,
  initialHeaderData,
  initialResponses,
  initialSignatures,
  isReadOnly = false,
  initialDate
}: NewInspectionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'next' | 'back' | 'submit' | 'draft' | 'add' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [inspectionId, setInspectionId] = useState<string | null>(initialInspectionId || null);
  const formRef = useRef<HTMLFormElement>(null);

  // State: Local Reference Data for inline creation
  const [localBuilders, setLocalBuilders] = useState(builders);
  const [localSites, setLocalSites] = useState(sites);
  const [localPositions, setLocalPositions] = useState(positions);

  const [isAddingBuilder, setIsAddingBuilder] = useState(false);
  const [newBuilderName, setNewBuilderName] = useState('');
  const [isSavingBuilder, setIsSavingBuilder] = useState(false);

  const [isAddingSite, setIsAddingSite] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [isSavingSite, setIsSavingSite] = useState(false);

  const [addingPositionIndex, setAddingPositionIndex] = useState<number | null>(null);
  const [newPositionName, setNewPositionName] = useState('');
  const [isSavingPosition, setIsSavingPosition] = useState(false);

  // Formatter for display
  const displayDate = new Date(initialDate || new Date()).toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // State: Form Header Data
  const [headerData, setHeaderData] = useState({
    builderId: initialHeaderData?.builderId || '',
    siteId: initialHeaderData?.siteId || '',
    operativesOnSite: initialHeaderData?.operativesOnSite || '',
    supervisorQualification: initialHeaderData?.supervisorQualification || profile?.qualification || ''
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
  const [signatures, setSignatures] = useState<Array<{ name: string; positionId: string; signatureData: string | null }>>(() => {
    if (initialSignatures && initialSignatures.length > 0) {
      return initialSignatures;
    }
    const profilePosition = positions.find((p: any) => p.name.toLowerCase() === profile?.job_title?.toLowerCase());
    return [{
      name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
      positionId: profilePosition ? profilePosition.id : '',
      signatureData: null
    }];
  });

  // Dynamically calculate total pages based on the current number of signatures
  const totalPages = sections.length + 1 + signatures.length; // Header + Sections + Signatures Array

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'builderId') {
      setHeaderData({ ...headerData, builderId: value, siteId: '' }); // Clear site when builder changes
    } else {
      setHeaderData({ ...headerData, [name]: value });
    }
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

  const handleCreateBuilder = async () => {
    if (!newBuilderName.trim()) return;
    setIsSavingBuilder(true);
    try {
      const res = await createBuilder(newBuilderName);
      if (res.success && res.builder) {
        setLocalBuilders(prev => [...prev, res.builder]);
        setHeaderData(prev => ({ ...prev, builderId: res.builder.id, siteId: '' }));
        setIsAddingBuilder(false);
        setNewBuilderName('');
      } else {
        setError(res.error || 'Failed to create builder');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSavingBuilder(false);
    }
  };

  const handleCreateSite = async () => {
    if (!newSiteName.trim() || !headerData.builderId) return;
    setIsSavingSite(true);
    try {
      const res = await createSite(newSiteName, headerData.builderId);
      if (res.success && res.site) {
        setLocalSites(prev => [...prev, res.site]);
        setHeaderData(prev => ({ ...prev, siteId: res.site.id }));
        setIsAddingSite(false);
        setNewSiteName('');
      } else {
        setError(res.error || 'Failed to create site');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSavingSite(false);
    }
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
        builderId: headerData.builderId,
        siteId: headerData.siteId,
        operativesOnSite: parseInt(headerData.operativesOnSite, 10) || 0,
        supervisorQualification: headerData.supervisorQualification,
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

  const handleNext = async () => {
    if (formRef.current && !formRef.current.reportValidity()) return;
    const saved = await autoSaveDraft(undefined, 'next');
    if (saved) setCurrentPage(prev => prev + 1);
  };

  const handleBack = async () => {
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
    if (formRef.current && !formRef.current.reportValidity()) return;

    const newSignatures = [...signatures, { name: '', positionId: '', signatureData: null }];
    setSignatures(newSignatures);
    const saved = await autoSaveDraft(newSignatures, 'add');
    if (saved) setCurrentPage(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPage < totalPages - 1) {
      await handleNext();
      return;
    }
    
    if (formRef.current && !formRef.current.reportValidity()) return;
    
    if (signatures.some(s => !s.name.trim() || !s.positionId || !s.signatureData)) {
      setError('Please complete all names, positions, and drawings for all signatures.');
      return;
    }

    setIsSubmitting(true);
    setLoadingAction('submit');
    setError(null);

    try {
      const submissionData = {
        inspectionId: inspectionId || undefined,
        builderId: headerData.builderId,
        siteId: headerData.siteId,
        operativesOnSite: parseInt(headerData.operativesOnSite, 10) || 0,
        supervisorQualification: headerData.supervisorQualification,
        responses,
        signatures: signatures.map(s => ({ ...s, signatureData: s.signatureData || '' })),
        status: 'Completed'
      };

      const result = await saveInspection(submissionData);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Failed to submit inspection');
        setIsSubmitting(false);
        setLoadingAction(null);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsSubmitting(false);
      setLoadingAction(null);
    }
  };

  // Dynamically filter available sites based on the selected builder
  const filteredSites = localSites.filter(s => !headerData.builderId || s.builder_id === headerData.builderId);

  return (
    <>
      {/* Page Title & Cancel Button */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isReadOnly ? 'View Site Inspection' : initialInspectionId ? 'Resume Site Inspection' : 'New Site Inspection'}
          </h1>
        {isReadOnly && (
          <p className="text-slate-500 mt-2">
            Review the completed inspection details below.
          </p>
        )}
        </div>
        {!isReadOnly ? (
          <button 
            type="button"
            disabled={isSubmitting}
            onClick={async () => {
              if (headerData.builderId) await autoSaveDraft(undefined, 'draft');
              router.push('/dashboard/inspections');
            }}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:shadow-sm transition-all text-sm flex items-center gap-2 disabled:opacity-50"
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
        ) : (
          <Link href="/dashboard/inspections" className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:shadow-sm transition-all text-sm flex items-center gap-2">
            Close
          </Link>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6 flex items-center gap-4">
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
              <p className="text-slate-900 font-semibold">{profile?.qualification || 'Not specified'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {/* Builder Selection / Creation */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="builderId" className="text-sm font-semibold text-slate-700">Builder</label>
                {!isReadOnly && !isAddingBuilder && (
                  <button type="button" onClick={() => setIsAddingBuilder(true)} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                    + Add New
                  </button>
                )}
              </div>
              {isAddingBuilder ? (
                <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-200">
                  <input
                    type="text"
                    value={newBuilderName}
                    onChange={(e) => setNewBuilderName(e.target.value)}
                    placeholder="Builder Name..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm"
                    autoFocus
                  />
                  <button type="button" onClick={handleCreateBuilder} disabled={isSavingBuilder} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 shrink-0">
                    {isSavingBuilder ? '...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setIsAddingBuilder(false)} disabled={isSavingBuilder} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors shrink-0">
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  id="builderId"
                  name="builderId"
                  value={headerData.builderId}
                  onChange={handleHeaderChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-slate-700"
                  required
                >
                  <option value="" disabled>Select a Builder</option>
                  {localBuilders.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Site Selection / Creation */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="siteId" className="text-sm font-semibold text-slate-700">Site</label>
                {!isReadOnly && !isAddingSite && headerData.builderId && (
                  <button type="button" onClick={() => setIsAddingSite(true)} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                    + Add New
                  </button>
                )}
              </div>
              {isAddingSite ? (
                <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-200">
                  <input
                    type="text"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    placeholder="Site Name..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm"
                    autoFocus
                  />
                  <button type="button" onClick={handleCreateSite} disabled={isSavingSite} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 shrink-0">
                    {isSavingSite ? '...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setIsAddingSite(false)} disabled={isSavingSite} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors shrink-0">
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  id="siteId"
                  name="siteId"
                  value={headerData.siteId}
                  onChange={handleHeaderChange}
                  disabled={!headerData.builderId}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                >
                  <option value="" disabled>Select a Site</option>
                  {filteredSites.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="operativesOnSite" className="text-sm font-semibold text-slate-700">Operatives on Site</label>
              <input
                type="number"
                id="operativesOnSite"
                name="operativesOnSite"
                value={headerData.operativesOnSite}
                onChange={handleHeaderChange}
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Date</label>
              <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 shadow-sm cursor-not-allowed">
                {displayDate}
              </div>
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
                    const showComments = responseTypeCode === 'YES_NO_NA_COMMENTS' || responseTypeCode === 'FREEFORM';
                    
                    return (
                      <div key={q.id} className="p-6 sm:px-8 flex flex-col gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                          <p className="text-slate-800 font-medium text-sm sm:text-base flex-1">{q.question_text}</p>
                          
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

                        {/* Comments Input */}
                        {showComments && (
                        <div>
                          <input
                            type="text"
                            value={resp.comments}
                            onChange={(e) => handleResponseChange(q.id, 'comments', e.target.value)}
                            placeholder={responseTypeCode === 'FREEFORM' ? "Enter your response..." : "Add a comment... (Required if 'No')"}
                            className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm ${resp.isCompliant === false && !resp.comments && responseTypeCode === 'YES_NO_NA_COMMENTS' ? 'border-red-300 placeholder:text-red-300' : 'border-slate-200'}`}
                            required={responseTypeCode === 'YES_NO_NA_COMMENTS' && resp.isCompliant === false}
                          />
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
                  <div key={index} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl relative">
                    {signatures.length > 1 && !isReadOnly && (
                      <button
                        type="button"
                        onClick={async () => {
                          const newSigs = signatures.filter((_, i) => i !== index);
                          setSignatures(newSigs);
                          setCurrentPage(prev => prev - 1);
                          await autoSaveDraft(newSigs);
                        }}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-700 font-semibold text-sm transition-colors"
                      >
                        Remove
                      </button>
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
                onClick={() => router.push('/dashboard/inspections')}
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
    </>
  );
}