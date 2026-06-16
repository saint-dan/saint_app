'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createInspectionTemplate } from '../../../../actions';

export interface TemplateData {
  id: string;
  name: string;
  description: string;
  sectionCount: number;
}

interface EditFormTemplatesListProps {
  initialTemplates: TemplateData[];
}

export default function EditFormTemplatesList({ initialTemplates }: EditFormTemplatesListProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;
    
    setIsSubmitting(true);
    const result = await createInspectionTemplate(newTemplateName.trim(), newTemplateDesc.trim());
    setIsSubmitting(false);

    if (result.success) {
      setNewTemplateName('');
      setNewTemplateDesc('');
      setIsModalOpen(false);
      router.refresh();
    } else {
      console.error(result.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4">
        <div>
          <Link href="/dashboard" className="text-sm font-bold text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Inspection Templates</h1>
          <h2 className="text-lg font-semibold text-slate-500 mt-1">Manage Report Types</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-sm transition-colors text-sm flex items-center gap-2"
          >
            + New Template
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {initialTemplates.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-12 text-center text-slate-500 font-medium">
            No templates found. Add your first template to get started.
          </div>
        ) : (
          initialTemplates.map((template) => (
            <div
              key={template.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_15px_rgb(0,0,0,0.02)] transition-all hover:shadow-md group"
            >
              {/* Content */}
              <Link href={`/inspections/edit_form/${template.id}`} className="flex-1 min-w-0 block">
                <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors text-lg">{template.name}</h3>
                {template.description && <p className="text-sm text-slate-500 truncate mt-1">{template.description}</p>}
              </Link>

              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                {/* Count Badge */}
                <div className="shrink-0 px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold border border-slate-100">
                  {template.sectionCount} {template.sectionCount === 1 ? 'Section' : 'Sections'}
                </div>

                {/* Link Arrow */}
                <Link 
                  href={`/inspections/edit_form/${template.id}`} 
                  className="shrink-0 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Add New Template</h2>
            <form onSubmit={handleCreateTemplate}>
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">Template Name</label>
                <input type="text" required value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Standard Site Inspection" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Description (Optional)</label>
                <input type="text" value={newTemplateDesc} onChange={(e) => setNewTemplateDesc(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Brief details..." />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting || !newTemplateName.trim()} className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-sm disabled:opacity-50 transition-all">Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}