'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createInspectionSection, updateInspectionSectionOrders, updateInspectionSection, deleteInspectionSection } from '../../../../actions';

export interface SectionData {
  id: string;
  title: string;
  display_order: number;
  questionCount: number;
}

interface EditFormSectionsListProps {
  initialSections: SectionData[];
  templateId: string;
  templateName: string;
}

export default function EditFormSectionsList({ initialSections, templateId, templateName }: EditFormSectionsListProps) {
  const router = useRouter();
  const [sections, setSections] = useState<SectionData[]>(initialSections);
  
  // Drag-and-drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingSection, setEditingSection] = useState<SectionData | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal State
  const [deletingSection, setDeletingSection] = useState<SectionData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handlers for Drag and Drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    // Setting timeout ensures the drag ghost image renders properly before we potentially add a class
    setTimeout(() => setDraggedIndex(index), 0);
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newSections = [...sections];
      const draggedItem = newSections[draggedIndex];
      
      // Remove from old position and insert at new position
      newSections.splice(draggedIndex, 1);
      newSections.splice(dragOverIndex, 0, draggedItem);

      // Re-calculate the display orders optimistically
      const updatedSections = newSections.map((s, i) => ({ ...s, display_order: i + 1 }));
      setSections(updatedSections);

      // Map data for server action
      const updates = updatedSections.map(s => ({ id: s.id, display_order: s.display_order }));
      await updateInspectionSectionOrders(updates, templateId);
      router.refresh(); // Refresh page data
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;
    
    setIsSubmitting(true);
    const result = await createInspectionSection(newSectionTitle.trim(), templateId);
    setIsSubmitting(false);

    if (result.success && result.section) {
      // Add new section to UI instantly
      setSections([...sections, { ...result.section, questionCount: 0 }]);
      setNewSectionTitle('');
      setIsModalOpen(false);
      router.refresh();
    } else {
      console.error(result.error);
    }
  };

  const openEditModal = (section: SectionData) => {
    setEditingSection(section);
    setEditSectionTitle(section.title);
  };

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection || !editSectionTitle.trim()) return;
    
    setIsUpdating(true);
    const result = await updateInspectionSection(editingSection.id, editSectionTitle.trim());
    setIsUpdating(false);

    if (result.success) {
      setSections(sections.map(s => s.id === editingSection.id ? { ...s, title: editSectionTitle.trim() } : s));
      setEditingSection(null);
      router.refresh();
    } else {
      console.error(result.error);
    }
  };

  const handleDeleteSection = async () => {
    if (!deletingSection) return;

    setIsDeleting(true);
    const result = await deleteInspectionSection(deletingSection.id);
    setIsDeleting(false);

    if (result.success) {
      setSections(sections.filter(s => s.id !== deletingSection.id));
      setDeletingSection(null);
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
          <Link href="/inspections/edit_form" className="text-sm font-bold text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Templates
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{templateName}</h1>
          <h2 className="text-lg font-semibold text-slate-500 mt-1">Sections</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-sm transition-colors text-sm flex items-center gap-2"
          >
            + New Section
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {sections.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-12 text-center text-slate-500 font-medium">
            No sections found. Add your first section to get started.
          </div>
        ) : (
          sections.map((section, index) => (
            <div
              key={section.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`flex items-center gap-4 bg-white p-4 rounded-2xl border transition-all select-none
                ${dragOverIndex === index ? 'border-blue-500 shadow-md scale-[1.01] z-10' : 'border-slate-100 shadow-[0_4px_15px_rgb(0,0,0,0.02)]'}
                ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}
                hover:shadow-md group`}
            >
              {/* Drag Handle */}
              <div className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-500 transition-colors p-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                </svg>
              </div>

              {/* Content */}
              <Link href={`/inspections/edit_form/${templateId}/${section.id}`} className="flex-1 min-w-0 block">
                <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{section.title}</h3>
              </Link>

              {/* Count Badge */}
              <div className="shrink-0 px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold border border-slate-100">
                {section.questionCount} {section.questionCount === 1 ? 'Question' : 'Questions'}
              </div>

              <div className="flex items-center gap-1">
                {/* Edit Button */}
                <button
                  onClick={(e) => { e.preventDefault(); openEditModal(section); }}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  title="Edit Section"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.89l10.685-10.685zM16.862 4.487L19.5 7.125" />
                  </svg>
                </button>

                {/* Delete Button */}
                <button
                  onClick={(e) => { e.preventDefault(); setDeletingSection(section); }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Delete Section"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>

                {/* Link Arrow */}
                <Link 
                  href={`/inspections/edit_form/${templateId}/${section.id}`} 
                  className="shrink-0 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all ml-1"
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

      {/* New Section Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Add New Section</h2>
            <form onSubmit={handleCreateSection}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Section Title</label>
                <input type="text" required value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Ground Floor Check" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting || !newSectionTitle.trim()} className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-sm disabled:opacity-50 transition-all">Save Section</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Edit Section</h2>
            <form onSubmit={handleUpdateSection}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Section Title</label>
                <input type="text" required value={editSectionTitle} onChange={(e) => setEditSectionTitle(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Ground Floor Check" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditingSection(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isUpdating || !editSectionTitle.trim()} className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-sm disabled:opacity-50 transition-all">
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Section Modal */}
      {deletingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">Delete Section?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete <strong>{deletingSection.title}</strong>? It will be removed from all future inspections using this template. Historical reports will be unaffected.
            </p>
            <div className="flex justify-center gap-3">
              <button type="button" onClick={() => setDeletingSection(null)} disabled={isDeleting} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button type="button" onClick={handleDeleteSection} disabled={isDeleting} className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center">
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}