'use client';

import React, { useTransition } from 'react';
import { updateUserStatus } from '../actions';
import { useRouter } from 'next/navigation';

export default function StatusButtons({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleStatusChange = (newStatus: 'Active' | 'Rejected') => {
    startTransition(async () => {
      try {
        await updateUserStatus(userId, newStatus);
        router.refresh(); // Automatically fetches the latest data on the server component to update the UI
      } catch (error) {
        console.error("Failed to update status", error);
        alert("Failed to update status. Please try again.");
      }
    });
  };

  return (
    <div className="flex gap-3 mt-4 sm:mt-0">
      <button 
        onClick={() => handleStatusChange('Rejected')} 
        disabled={isPending} 
        className="px-6 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 text-sm"
      >
        Reject
      </button>
      <button 
        onClick={() => handleStatusChange('Active')} 
        disabled={isPending} 
        className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 text-sm"
      >
        {isPending ? 'Processing...' : 'Approve'}
      </button>
    </div>
  );
}