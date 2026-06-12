'use client';

import React, { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { deleteInspection } from '../../../../actions';

interface InspectionsListProps {
  initialInspections: any[];
  currentStatus: string;
  currentQuery: string;
}

export default function InspectionsList({ initialInspections, currentStatus, currentQuery }: InspectionsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(currentQuery);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inspectionToDelete, setInspectionToDelete] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm) {
      params.set('query', searchTerm);
    } else {
      params.delete('query');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleStatusToggle = (newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', newStatus);
    params.delete('query'); // Clear search query when switching tabs
    setSearchTerm('');
    router.push(`${pathname}?${params.toString()}`);
  };

  const confirmDelete = async () => {
    if (!inspectionToDelete) return;
    
    const id = inspectionToDelete;
    setInspectionToDelete(null); // Hide modal immediately
    setDeletingId(id);
    
    const result = await deleteInspection(id);
    
    if (!result.success) {
      alert(result.error);
    }
    setDeletingId(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Inspections</h1>
          <p className="text-slate-500 mt-1">View and manage site inspections.</p>
        </div>
        <Link 
          href="/dashboard"
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm flex items-center gap-2"
        >
          Back to Dashboard
        </Link>
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

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full md:w-auto flex items-center gap-2">
          <div className="relative w-full md:w-72">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search builder, site..."
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

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Builder</th>
                <th className="px-6 py-5">Site</th>
                <th className="px-6 py-5">Inspector</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialInspections.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No {currentStatus.toLowerCase()} inspections found.
                  </td>
                </tr>
              ) : (
                initialInspections.map((inspection) => (
                  <tr key={inspection.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5 text-sm font-semibold text-slate-900 whitespace-nowrap">
                      {formatDate(inspection.inspection_date)}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-700">
                      {extractName(inspection.builders)}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-700">
                      {extractName(inspection.sites)}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-700">
                      {extractUserName(inspection.users)}
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      <Link
                        href={`/dashboard/inspections/${inspection.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-blue-600 hover:text-blue-800 hover:border-blue-200 hover:bg-blue-50 font-semibold rounded-xl text-sm transition-all shadow-sm mr-2"
                      >
                        {currentStatus === 'Draft' ? 'Resume' : 'View'}
                      </Link>
                      <button
                        onClick={() => setInspectionToDelete(inspection.id)}
                        disabled={deletingId === inspection.id}
                        className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-red-600 hover:text-red-800 hover:border-red-200 hover:bg-red-50 font-semibold rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
                      >
                        {deletingId === inspection.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {inspectionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setInspectionToDelete(null)}
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
                  onClick={() => setInspectionToDelete(null)}
                  className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}