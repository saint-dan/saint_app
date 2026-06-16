'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createInspectionQuestion, updateInspectionQuestionOrders, deleteInspectionSection, deleteInspectionQuestion } from '../../../../actions';

export interface QuestionData {
  id: string;
  question_text: string;
  display_order: number;
  allow_photos?: boolean | null;
  response_type_id: string | null;
  response_types: { name: string } | null;
}

interface EditFormQuestionsListProps {
  sectionId: string;
  sectionTitle: string;
  initialQuestions: any[];
  responseTypes: { id: string; name: string }[];
}

export default function EditFormQuestionsList({ sectionId, sectionTitle, initialQuestions, responseTypes }: EditFormQuestionsListProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionData[]>(initialQuestions);
  
  // Drag-and-drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Add Question Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newResponseTypeId, setNewResponseTypeId] = useState(responseTypes[0]?.id || '');
  const [newAllowPhotos, setNewAllowPhotos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Section Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete Question Modal State
  const [questionToDelete, setQuestionToDelete] = useState<QuestionData | null>(null);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);

  // View Question Modal State
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionData | null>(null);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setDraggedIndex(index), 0);
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newQuestions = [...questions];
      const draggedItem = newQuestions[draggedIndex];
      
      newQuestions.splice(draggedIndex, 1);
      newQuestions.splice(dragOverIndex, 0, draggedItem);

      const updatedQuestions = newQuestions.map((q, i) => ({ ...q, display_order: i + 1 }));
      setQuestions(updatedQuestions);

      const updates = updatedQuestions.map(q => ({ id: q.id, display_order: q.display_order }));
      await updateInspectionQuestionOrders(updates, sectionId);
      router.refresh();
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Add Question Action
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !newResponseTypeId) return;
    
    setIsSubmitting(true);
    const result = await createInspectionQuestion(sectionId, newQuestionText.trim(), newResponseTypeId, newAllowPhotos);
    setIsSubmitting(false);

    if (result.success && result.question) {
      setQuestions([...questions, result.question]);
      setNewQuestionText('');
      setNewResponseTypeId(responseTypes[0]?.id || '');
      setNewAllowPhotos(false);
      setIsAddModalOpen(false);
      router.refresh();
    } else {
      console.error(result.error);
    }
  };

  // Delete Section Action
  const handleDeleteSection = async () => {
    setIsDeleting(true);
    const result = await deleteInspectionSection(sectionId);
    setIsDeleting(false);

    if (result.success) {
      router.push('/inspections/edit_form');
    } else {
      console.error(result.error);
      setIsDeleteModalOpen(false);
    }
  };

  // Delete Question Action
  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;
    setIsDeletingQuestion(true);
    const result = await deleteInspectionQuestion(questionToDelete.id, sectionId);
    setIsDeletingQuestion(false);

    if (result.success) {
      setQuestions(questions.filter(q => q.id !== questionToDelete.id));
      setQuestionToDelete(null);
      router.refresh();
    } else {
      console.error(result.error);
    }
  };

  const getResponseTypeName = (q: any) => {
    if (!q.response_types) return '-';
    if (Array.isArray(q.response_types)) return q.response_types[0]?.name || '-';
    return q.response_types.name || '-';
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
            Back
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Inspection Report Template</h1>
          <h2 className="text-lg font-semibold text-slate-500 mt-1">Questions - {sectionTitle}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl shadow-sm transition-colors text-sm flex items-center gap-2"
          >
            Delete Section
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-sm transition-colors text-sm flex items-center gap-2"
          >
            + Add Question
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {questions.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-12 text-center text-slate-500 font-medium">
            No questions found. Add your first question to get started.
          </div>
        ) : (
          questions.map((question, index) => (
            <div
              key={question.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => setSelectedQuestion(question)}
              className={`flex items-center gap-4 bg-white p-4 rounded-2xl border transition-all select-none cursor-pointer
                ${dragOverIndex === index ? 'border-blue-500 shadow-md scale-[1.01] z-10' : 'border-slate-100 hover:border-blue-200 shadow-[0_4px_15px_rgb(0,0,0,0.02)]'}
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
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-900 truncate">{question.question_text}</h3>
              </div>

              {/* Badge */}
              <div className="shrink-0 px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold border border-slate-100">
                {getResponseTypeName(question)}
              </div>

              {/* Photo Icon Column */}
              <div className="shrink-0 w-9 h-9 flex items-center justify-center text-blue-400" title={question.allow_photos ? "Photos allowed" : undefined}>
                {question.allow_photos && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Question Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Add New Question</h2>
            <form onSubmit={handleCreateQuestion}>
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">Question Text</label>
                <input type="text" required value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Is the site clean?" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Response Type</label>
                <select 
                  required 
                  value={newResponseTypeId} 
                  onChange={(e) => setNewResponseTypeId(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="" disabled>Select a response type...</option>
                  {responseTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-8 flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="allowPhotos"
                  checked={newAllowPhotos}
                  onChange={(e) => setNewAllowPhotos(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                />
                <label htmlFor="allowPhotos" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                  Allow photo uploads for this question
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting || !newQuestionText.trim() || !newResponseTypeId} className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-sm disabled:opacity-50 transition-all">Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">Delete Section?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this section? It will be removed from all future inspections.
            </p>
            <div className="flex justify-center gap-3">
              <button type="button" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button type="button" onClick={handleDeleteSection} disabled={isDeleting} className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center">
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Question Confirmation Modal */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">Delete Question?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this question?
            </p>
            <div className="flex justify-center gap-3">
              <button type="button" onClick={() => setQuestionToDelete(null)} disabled={isDeletingQuestion} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button type="button" onClick={confirmDeleteQuestion} disabled={isDeletingQuestion} className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center">
                {isDeletingQuestion ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Question Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-extrabold text-slate-900">Question Details</h2>
              <button onClick={() => setSelectedQuestion(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Question Text</span>
                <p className="text-slate-900 font-medium">{selectedQuestion.question_text}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Response Type</span>
                  <p className="text-slate-900 font-medium">{getResponseTypeName(selectedQuestion)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Photos Allowed</span>
                  <p className="text-slate-900 font-medium">{selectedQuestion.allow_photos ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center gap-3">
              <button 
                type="button" 
                onClick={() => {
                  setQuestionToDelete(selectedQuestion);
                  setSelectedQuestion(null);
                }} 
                className="px-5 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedQuestion(null)} 
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}