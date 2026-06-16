'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createInspectionTemplate, updateInspectionTemplate, deleteInspectionTemplate } from '../../../../actions';

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

  // Edit Modal State
  const [editingTemplate, setEditingTemplate] = useState<TemplateData | null>(null);
  const [editTemplateName, setEditTemplateName] = useState('');
  const [editTemplateDesc, setEditTemplateDesc] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal State
  const [deletingTemplate, setDeletingTemplate] = useState<TemplateData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const openEditModal = (template: TemplateData) => {
    setEditingTemplate(template);
    setEditTemplateName(template.name);
    setEditTemplateDesc(template.description || '');
  };

  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !editTemplateName.trim()) return;
    
    setIsUpdating(true);
    const result = await updateInspectionTemplate(editingTemplate.id, {
      name: editTemplateName.trim(),
      description: editTemplateDesc.trim()
    });
    setIsUpdating(false);

    if (result.success) {
      setEditingTemplate(null);
      router.refresh();
    } else {
      console.error(result.error);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return;

    setIsDeleting(true);
    const result = await deleteInspectionTemplate(deletingTemplate.id);
    setIsDeleting(false);

    if (result.success) {
      setDeletingTemplate(null);
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Edit Inspection Templates</h1>
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

                <div className="flex items-center gap-1">
                  {/* Edit Button */}
                  <button
                    onClick={(e) => { e.preventDefault(); openEditModal(template); }}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="Edit Template"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.89l10.685-10.685zM16.862 4.487L19.5 7.125" />
                    </svg>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => { e.preventDefault(); setDeletingTemplate(template); }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete Template"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>

                  {/* Link Arrow */}
                  <Link 
                    href={`/inspections/edit_form/${template.id}`} 
                    className="shrink-0 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all ml-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
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

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Edit Template</h2>
            <form onSubmit={handleUpdateTemplate}>
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">Template Name</label>
                <input type="text" required value={editTemplateName} onChange={(e) => setEditTemplateName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Standard Site Inspection" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Description (Optional)</label>
                <input type="text" value={editTemplateDesc} onChange={(e) => setEditTemplateDesc(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Brief details..." />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditingTemplate(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isUpdating || !editTemplateName.trim()} className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-sm disabled:opacity-50 transition-all">
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Template Modal */}
      {deletingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">Delete Template?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete <strong>{deletingTemplate.name}</strong>? This will effectively remove access to all related sections and questions for future inspections. Note: Historical reports are unaffected.
            </p>
            <div className="flex justify-center gap-3">
              <button type="button" onClick={() => setDeletingTemplate(null)} disabled={isDeleting} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button type="button" onClick={handleDeleteTemplate} disabled={isDeleting} className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center">
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}