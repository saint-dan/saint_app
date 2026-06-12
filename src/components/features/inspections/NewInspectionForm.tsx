'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { saveInspection, createBuilder, createSite } from '../../../../actions';

interface NewInspectionFormProps {
  profile: any;
  builders: any[];
  sites: any[];
  sections: any[];
  questions: any[];
}

export default function NewInspectionForm({
  profile,
  builders,
  sites,
  sections,
  questions
}: NewInspectionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const totalPages = sections.length + 1; // Header + 1 page per section

  // State: Local Reference Data for inline creation
  const [localBuilders, setLocalBuilders] = useState(builders);
  const [localSites, setLocalSites] = useState(sites);

  const [isAddingBuilder, setIsAddingBuilder] = useState(false);
  const [newBuilderName, setNewBuilderName] = useState('');
  const [isSavingBuilder, setIsSavingBuilder] = useState(false);

  const [isAddingSite, setIsAddingSite] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [isSavingSite, setIsSavingSite] = useState(false);

  // Formatter for display
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // State: Form Header Data
  const [headerData, setHeaderData] = useState({
    builderId: '',
    siteId: '',
    operativesOnSite: '',
    supervisorQualification: profile?.qualification || ''
  });

  // State: Question Responses
  const [responses, setResponses] = useState<Record<string, { isCompliant: boolean | null, comments: string }>>(() => {
    const initial: Record<string, { isCompliant: boolean | null, comments: string }> = {};
    questions.forEach(q => {
      initial[q.id] = { isCompliant: null, comments: '' };
    });
    return initial;
  });

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'builderId') {
      setHeaderData({ ...headerData, builderId: value, siteId: '' }); // Clear site when builder changes
    } else {
      setHeaderData({ ...headerData, [name]: value });
    }
  };

  const handleResponseChange = (questionId: string, field: 'isCompliant' | 'comments', value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], [field]: value }
    }));
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

  const autoSaveDraft = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const submissionData = {
        inspectionId: inspectionId || undefined,
        builderId: headerData.builderId,
        siteId: headerData.siteId,
        operativesOnSite: parseInt(headerData.operativesOnSite, 10) || 0,
        supervisorQualification: headerData.supervisorQualification,
        responses,
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
    }
  };

  const handleNext = async () => {
    if (formRef.current && !formRef.current.reportValidity()) return;
    const saved = await autoSaveDraft();
    if (saved) setCurrentPage(prev => prev + 1);
  };

  const handleBack = async () => {
    await autoSaveDraft();
    setCurrentPage(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPage < totalPages - 1) {
      await handleNext();
      return;
    }
    
    if (formRef.current && !formRef.current.reportValidity()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const submissionData = {
        inspectionId: inspectionId || undefined,
        builderId: headerData.builderId,
        siteId: headerData.siteId,
        operativesOnSite: parseInt(headerData.operativesOnSite, 10) || 0,
        supervisorQualification: headerData.supervisorQualification,
        responses,
        status: 'Completed'
      };

      const result = await saveInspection(submissionData);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Failed to submit inspection');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  // Dynamically filter available sites based on the selected builder
  const filteredSites = localSites.filter(s => !headerData.builderId || s.builder_id === headerData.builderId);

  return (
    <>
      {/* Page Title & Cancel Button */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">New Site Inspection</h1>
          <p className="text-slate-500 mt-2">Complete the site inspection checklist below.</p>
        </div>
        <button 
          type="button"
          onClick={async () => {
            if (headerData.builderId) await autoSaveDraft();
            router.push('/dashboard');
          }}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:shadow-sm transition-all text-sm flex items-center gap-2"
        >
          Save Draft & Exit
        </button>
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
                {!isAddingBuilder && (
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
                {!isAddingSite && headerData.builderId && (
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
                {today}
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
                    
                    return (
                      <div key={q.id} className="p-6 sm:px-8 flex flex-col gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                          <p className="text-slate-800 font-medium text-sm sm:text-base flex-1">{q.question_text}</p>
                          
                          {/* Yes / No / N-A Toggle */}
                          <div className="flex bg-slate-100 p-1 rounded-xl w-fit shrink-0">
                            <button
                              type="button"
                              onClick={() => handleResponseChange(q.id, 'isCompliant', true)}
                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${resp.isCompliant === true ? 'bg-white shadow-sm text-green-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResponseChange(q.id, 'isCompliant', false)}
                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${resp.isCompliant === false ? 'bg-white shadow-sm text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                              No
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResponseChange(q.id, 'isCompliant', null)}
                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${resp.isCompliant === null ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                              N/A
                            </button>
                          </div>
                        </div>

                        {/* Comments Input */}
                        <div>
                          <input
                            type="text"
                            value={resp.comments}
                            onChange={(e) => handleResponseChange(q.id, 'comments', e.target.value)}
                            placeholder="Add a comment... (Required if 'No')"
                            className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm ${resp.isCompliant === false && !resp.comments ? 'border-red-300 placeholder:text-red-300' : 'border-slate-200'}`}
                            required={resp.isCompliant === false}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

        {/* 3. Submit Area */}
        <div className="flex justify-between items-center gap-4 mt-2">
          <div className="flex items-center">
            {currentPage > 0 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                Back
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
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Next'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : 'Submit Inspection'}
              </button>
            )}
          </div>
          </div>
      </form>
    </>
  );
}