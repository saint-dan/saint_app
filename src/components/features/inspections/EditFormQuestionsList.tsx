'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createInspectionQuestion, updateInspectionQuestion, updateInspectionQuestionOrders, deleteInspectionQuestion } from '../../../../actions';

export interface QuestionData {
  id: string;
  question_text: string;
  display_order: number;
  allow_photos?: boolean | null;
  is_mandatory?: boolean | null;
  response_type_id: string | null;
  response_types: { name: string } | null;
}

interface EditFormQuestionsListProps {
  templateId: string;
  sectionId: string;
  sectionTitle: string;
  templateName: string;
  initialQuestions: any[];
  responseTypes: { id: string; name: string }[];
}

export default function EditFormQuestionsList({ templateId, sectionId, sectionTitle, templateName, initialQuestions, responseTypes }: EditFormQuestionsListProps) {
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
  const [newIsMandatory, setNewIsMandatory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Question Modal State
  const [questionToDelete, setQuestionToDelete] = useState<QuestionData | null>(null);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);

  // Edit Question Modal State
  const [editingQuestion, setEditingQuestion] = useState<QuestionData | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editResponseTypeId, setEditResponseTypeId] = useState('');
  const [editAllowPhotos, setEditAllowPhotos] = useState(false);
  const [editIsMandatory, setEditIsMandatory] = useState(false);
  const [isUpdatingQuestion, setIsUpdatingQuestion] = useState(false);

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
    const result = await createInspectionQuestion(sectionId, newQuestionText.trim(), newResponseTypeId, newAllowPhotos, newIsMandatory);
    setIsSubmitting(false);

    if (result.success && result.question) {
      setQuestions([...questions, result.question]);
      setNewQuestionText('');
      setNewResponseTypeId(responseTypes[0]?.id || '');
      setNewAllowPhotos(false);
      setNewIsMandatory(false);
      setIsAddModalOpen(false);
      router.refresh();
    } else {
      console.error(result.error);
    }
  };

  // Edit Question Handlers
  const openEditModal = (q: QuestionData) => {
    setEditingQuestion(q);
    setEditQuestionText(q.question_text);
    setEditResponseTypeId(q.response_type_id || responseTypes[0]?.id || '');
    setEditAllowPhotos(q.allow_photos || false);
    setEditIsMandatory(q.is_mandatory || false);
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !editQuestionText.trim() || !editResponseTypeId) return;
    
    setIsUpdatingQuestion(true);
    const result = await updateInspectionQuestion(editingQuestion.id, editQuestionText.trim(), editResponseTypeId, editAllowPhotos, editIsMandatory, sectionId);
    setIsUpdatingQuestion(false);

    if (result.success && result.question) {
      setQuestions(questions.map(q => q.id === editingQuestion.id ? result.question : q));
      setEditingQuestion(null);
      router.refresh();
    } else {
      console.error(result.error);
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
          <Link href={`/inspections/edit_form/${templateId}`} className="text-sm font-bold text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Edit Inspection Templates</h1>
          <h2 className="text-lg font-semibold text-slate-500 mt-1">Template: {templateName}</h2>
          <h3 className="text-lg font-semibold text-slate-500 mt-0.5">Section: {sectionTitle}</h3>
        </div>
        <div className="flex items-center gap-3">
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
              onClick={() => openEditModal(question)}
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

              {/* Badges */}
              <div className="flex items-center gap-2">
                <div className="shrink-0 px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold border border-slate-100">
                  {getResponseTypeName(question)}
                </div>
                <div className={`shrink-0 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 ${question.is_mandatory ? 'visible' : 'invisible'}`}>
                  Mandatory
                </div>
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
              <div className="mb-8 flex flex-col gap-4">
                <div className="flex items-center gap-3">
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
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="isMandatory"
                    checked={newIsMandatory}
                    onChange={(e) => setNewIsMandatory(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                  />
                  <label htmlFor="isMandatory" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                    Make question mandatory (user must answer)
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting || !newQuestionText.trim() || !newResponseTypeId} className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-sm disabled:opacity-50 transition-all">Save Question</button>
              </div>
            </form>
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

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Edit Question</h2>
            <form onSubmit={handleUpdateQuestion}>
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">Question Text</label>
                <input type="text" required value={editQuestionText} onChange={(e) => setEditQuestionText(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Is the site clean?" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Response Type</label>
                <select 
                  required 
                  value={editResponseTypeId} 
                  onChange={(e) => setEditResponseTypeId(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="" disabled>Select a response type...</option>
                  {responseTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-8 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="editAllowPhotos"
                    checked={editAllowPhotos}
                    onChange={(e) => setEditAllowPhotos(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                  />
                  <label htmlFor="editAllowPhotos" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                    Allow photo uploads for this question
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="editIsMandatory"
                    checked={editIsMandatory}
                    onChange={(e) => setEditIsMandatory(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                  />
                  <label htmlFor="editIsMandatory" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                    Make question mandatory
                  </label>
                </div>
              </div>
              <div className="flex justify-between items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setQuestionToDelete(editingQuestion);
                    setEditingQuestion(null);
                  }} 
                  className="px-5 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-2 shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setEditingQuestion(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0">Cancel</button>
                  <button type="submit" disabled={isUpdatingQuestion || !editQuestionText.trim() || !editResponseTypeId} className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-sm disabled:opacity-50 transition-all">
                    {isUpdatingQuestion ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}