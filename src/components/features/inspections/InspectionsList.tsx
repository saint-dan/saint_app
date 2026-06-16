'use client';

import React, { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ROLES } from '@/lib/constants';
import { createDraftInspection, updateInspectionComments } from '../../../../actions';

interface InspectionsListProps {
  initialInspections: any[];
  currentStatus: string;
  currentQuery: string;
  currentPage: number;
  totalPages: number;
  currentSortField: string;
  currentSortOrder: string;
  roleName?: string;
  inspectors?: { id: string; name: string }[];
  currentInspectorId?: string;
  templates?: { id: string; name: string }[];
}

export default function InspectionsList({ initialInspections, currentStatus, currentQuery, currentPage, totalPages, currentSortField, currentSortOrder, roleName, inspectors = [], currentInspectorId = '', templates = [] }: InspectionsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(currentQuery);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedInspectionForComment, setSelectedInspectionForComment] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [isSavingComment, setIsSavingComment] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm) {
      params.set('query', searchTerm);
    } else {
      params.delete('query');
    }
    params.set('page', '1'); // Reset to page 1 on new search
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleStatusToggle = (newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', newStatus);
    params.delete('query'); // Clear search query when switching tabs
    params.delete('inspectorId'); // Clear inspector filter when switching tabs
    params.set('page', '1'); // Reset to page 1
    params.delete('sortField'); // Reset to default sorts
    params.delete('sortOrder');
    setSearchTerm('');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSortField === field) {
      params.set('sortOrder', currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sortField', field);
      params.set('sortOrder', field === 'date' ? 'desc' : 'asc'); // Dates default to desc, text defaults to asc
    }
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleInspectorFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set('inspectorId', e.target.value);
    } else {
      params.delete('inspectorId');
    }
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDownload = (e: React.MouseEvent, pdfUrl: string | null) => {
    e.stopPropagation();
    
    if (!pdfUrl) {
      alert('PDF not found for this inspection. It may still be generating or was not saved correctly.');
      return;
    }
    window.open(pdfUrl, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  // Safely extract name from potentially nested supabase relations
  const extractName = (rel: any) => {
    if (!rel) return '-';
    if (Array.isArray(rel)) return rel[0]?.name || '-';
    return rel.name || '-';
  };

  const extractUserName = (rel: any) => {
    if (!rel) return '-';
    if (Array.isArray(rel)) return `${rel[0]?.first_name || ''} ${rel[0]?.last_name || ''}`.trim() || '-';
    return `${rel.first_name || ''} ${rel.last_name || ''}`.trim() || '-';
  };

  const handleStartInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId) return;
    setIsCreatingDraft(true);
    const result = await createDraftInspection(selectedTypeId);
    if (result.success && result.inspectionId) {
      router.push(`/inspections/${result.inspectionId}`);
    } else {
      alert(result.error || 'Failed to create draft inspection');
      setIsCreatingDraft(false);
    }
  };

  const openCommentModal = (inspection: any) => {
    setSelectedInspectionForComment(inspection);
    setCommentText(inspection.comments || '');
    setIsCommentModalOpen(true);
  };

  const handleSaveComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInspectionForComment) return;

    setIsSavingComment(true);
    const result = await updateInspectionComments(selectedInspectionForComment.id, commentText);
    setIsSavingComment(false);

    if (result.success) {
      setIsCommentModalOpen(false);
      setSelectedInspectionForComment(null);
      router.refresh();
    } else {
      alert(result.error || 'Failed to update comments');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (currentSortField !== field) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }
    return currentSortOrder === 'asc' ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6">
        <div>
          <Link href="/dashboard" className="text-sm font-bold text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Inspections</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {roleName === ROLES.ADMIN && (
            <Link 
              href="/inspections/edit_form"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl shadow-sm transition-colors text-sm flex items-center gap-2 border border-slate-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Templates
            </Link>
          )}
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-sm transition-colors text-sm flex items-center gap-2"
          >
            + New Inspection
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Status Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-fit">
          <button
            onClick={() => handleStatusToggle('Draft')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${currentStatus === 'Draft' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Drafts
          </button>
          <button
            onClick={() => handleStatusToggle('Completed')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${currentStatus === 'Completed' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Completed
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row w-full md:w-auto items-center gap-3">
          {roleName === ROLES.ADMIN && (
            <select
              value={currentInspectorId}
              onChange={handleInspectorFilter}
              className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-700 font-medium"
            >
              <option value="">All Inspectors</option>
              {inspectors.map(inspector => (
                <option key={inspector.id} value={inspector.id}>{inspector.name}</option>
              ))}
            </select>
          )}

          <form onSubmit={handleSearch} className="w-full sm:w-auto flex items-center gap-2">
            <div className="relative w-full md:w-72">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm shrink-0">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-5 cursor-pointer hover:bg-slate-100 transition-colors group select-none" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-2">Inspection Date <SortIcon field="date" /></div>
                </th>
                <th className="px-6 py-5 cursor-pointer hover:bg-slate-100 transition-colors group select-none" onClick={() => handleSort('template')}>
                  <div className="flex items-center gap-2">Inspection Type <SortIcon field="template" /></div>
                </th>
                <th className="px-6 py-5 cursor-pointer hover:bg-slate-100 transition-colors group select-none" onClick={() => handleSort('inspector')}>
                  <div className="flex items-center gap-2">Inspector <SortIcon field="inspector" /></div>
                </th>
                <th className="px-6 py-5 cursor-pointer hover:bg-slate-100 transition-colors group select-none" onClick={() => handleSort('comments')}>
                  <div className="flex items-center gap-2">Comments <SortIcon field="comments" /></div>
                </th>
                <th className="px-6 py-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialInspections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No {currentStatus.toLowerCase()} inspection reports found.
                  </td>
                </tr>
              ) : (
                initialInspections.map((inspection) => (
                  <tr 
                    key={inspection.id} 
                    onClick={() => router.push(`/inspections/${inspection.id}`)}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-5 text-sm font-semibold text-slate-900 whitespace-nowrap">
                      {formatDate(inspection.inspection_date)}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-700">
                      {extractName(inspection.inspection_templates) || 'Standard'}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-700">
                      {extractUserName(inspection.users)}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-700 max-w-[200px] truncate">
                      {inspection.comments || <span className="text-slate-400 italic"></span>}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openCommentModal(inspection); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Add/Edit Comments"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                          </svg>
                        </button>
                      {currentStatus === 'Draft' ? (
                        <Link
                          href={`/inspections/${inspection.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-blue-600 hover:text-blue-800 hover:border-blue-200 hover:bg-blue-50 font-semibold rounded-xl text-sm transition-all shadow-sm"
                        >
                          Resume
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleDownload(e, inspection.pdf_url)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 hover:border-blue-200 font-semibold rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Download
                        </button>
                      )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-white border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 font-medium text-center sm:text-left">
              Page <span className="font-bold text-slate-900">{currentPage}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Inspection Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Start New Inspection</h2>
            <form onSubmit={handleStartInspection}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Inspection Type</label>
                <select 
                  required 
                  value={selectedTypeId} 
                  onChange={(e) => setSelectedTypeId(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700 font-medium"
                >
                  <option value="" disabled>Select an Inspection Type...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex w-full gap-3">
                <button type="button" onClick={() => setIsNewModalOpen(false)} disabled={isCreatingDraft} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isCreatingDraft || !selectedTypeId} className="flex-1 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {isCreatingDraft ? 'Starting...' : 'Start'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {isCommentModalOpen && selectedInspectionForComment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Inspection Comments</h2>
            <form onSubmit={handleSaveComment}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Comments</label>
                <textarea 
                  value={commentText} 
                  onChange={(e) => setCommentText(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700 font-medium resize-none"
                  rows={4}
                  placeholder="Add your comments here..."
                />
              </div>
              <div className="flex w-full gap-3">
                <button type="button" onClick={() => setIsCommentModalOpen(false)} disabled={isSavingComment} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isSavingComment} className="flex-1 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {isSavingComment ? 'Saving...' : 'Save Comments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}