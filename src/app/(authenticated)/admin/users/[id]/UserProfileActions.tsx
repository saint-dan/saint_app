/**
 * Component: UserProfileActions
 * Description: Client component providing admin actions (Change Role, Change Status) 
 * for a specific user profile. Renders custom modals and triggers server mutations.
 */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserRole, updateUserStatus } from '../../../../../../actions';
import { resendInviteAction } from '../actions';

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface UserProfileActionsProps {
  userId: string;
  currentRoleId: string;
  currentStatus: string;
  roles: Role[];
}

export default function UserProfileActions({ 
  userId, 
  currentRoleId, 
  currentStatus, 
  roles 
}: UserProfileActionsProps) {
  const router = useRouter();
  
  // Modal states
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  
  // Form states
  const [selectedRole, setSelectedRole] = useState(currentRoleId);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus === 'Pending' ? 'Active' : currentStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const selectedRoleDetails = roles.find(r => r.id === selectedRole);

  const handleSaveRole = async () => {
    setIsSubmitting(true);
    const result = await updateUserRole(userId, selectedRole);
    if (!result.success) {
      alert('Failed to update role: ' + result.error);
    }
    setIsSubmitting(false);
    setIsRoleModalOpen(false);
    router.refresh();
  };

  const handleSaveStatus = async () => {
    setIsSubmitting(true);
    const result = await updateUserStatus(userId, selectedStatus);
    if (!result.success) {
      alert('Failed to update status: ' + result.error);
    }
    setIsSubmitting(false);
    setIsStatusModalOpen(false);
    router.refresh();
  };

  const handleResendInvite = async () => {
    setIsResending(true);
    try {
      await resendInviteAction(userId);
      alert('Invite email successfully resent!');
    } catch (err: any) {
      alert(err.message || 'Failed to resend invite.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsRoleModalOpen(true)}
        className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors text-sm"
      >
        Change Role
      </button>
      <button
        onClick={() => setIsStatusModalOpen(true)}
        className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors text-sm"
      >
        Change Status
      </button>
      {currentStatus === 'Invited' && (
        <button
          onClick={handleResendInvite}
          disabled={isResending}
          className="order-last px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-xl shadow-sm hover:bg-blue-100 transition-colors text-sm flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
          {isResending ? 'Resending...' : 'Resend Invite'}
        </button>
      )}

      {/* Change Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Change User Role</h2>
            
            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-2">Select Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {selectedRoleDetails?.description && (
                <p className="mt-3 text-sm text-slate-500 font-medium">
                  {selectedRoleDetails.description}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsRoleModalOpen(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-sm disabled:opacity-50 transition-all"
              >
                {isSubmitting ? 'Saving...' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Change User Status</h2>
            
            <p className="text-sm text-slate-500 mb-6 font-medium">
              Setting the status to <strong className="text-slate-700">Active</strong> allows the user to log in and use the system. Setting it to <strong className="text-slate-700">Inactive</strong> will immediately block their access.
            </p>

            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-2">Select Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStatus}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-sm disabled:opacity-50 transition-all"
              >
                {isSubmitting ? 'Saving...' : 'Save Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}