'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createInspectionSection, updateInspectionSectionOrders } from '../../../../actions';

export interface SectionData {
  id: string;
  title: string;
  display_order: number;
  questionCount: number;
}

interface EditFormSectionsListProps {
  initialSections: SectionData[];
}

export default function EditFormSectionsList({ initialSections }: EditFormSectionsListProps) {
  const router = useRouter();
  const [sections, setSections] = useState<SectionData[]>(initialSections);
  
  // Drag-and-drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await updateInspectionSectionOrders(updates);
      router.refresh(); // Refresh page data
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;
    
    setIsSubmitting(true);
    const result = await createInspectionSection(newSectionTitle.trim());
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/inspections" className="text-sm font-bold text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to List
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Edit Inspection Form</h1>
          <p className="text-slate-500 mt-1">Manage sections and questions. Drag to reorder.</p>
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
              <Link href={`/dashboard/inspections/edit_form/${section.id}`} className="flex-1 min-w-0 block">
                <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{section.title}</h3>
              </Link>

              {/* Count Badge */}
              <div className="shrink-0 px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold border border-slate-100">
                {section.questionCount} {section.questionCount === 1 ? 'Question' : 'Questions'}
              </div>

              {/* Link Arrow */}
              <Link 
                href={`/dashboard/inspections/edit_form/${section.id}`} 
                className="shrink-0 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </div>
          ))
        )}
      </div>

      {/* New Section Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
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
    </div>
  );
}