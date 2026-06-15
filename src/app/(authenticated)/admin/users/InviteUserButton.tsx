'use client';

import React, { useState } from 'react';
import { inviteAdminUser } from './actions';

interface Role {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

interface InviteUserButtonProps {
  roles: Role[];
  locations: Location[];
}

export default function InviteUserButton({ roles, locations }: InviteUserButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleId: roles.length > 0 ? roles[0].id : '',
    primaryLocationId: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.roleId || !formData.primaryLocationId) return;

    setIsSubmitting(true);
    setError(null);

    let formattedPhone = formData.phone;
    if (formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/\s+/g, '');
      const ukMobileRegex = /^(?:07\d{9}|\+447\d{9})$/;
      if (!ukMobileRegex.test(cleanPhone)) {
        setError('Please enter a valid UK mobile number (e.g., 07123 456789).');
        setIsSubmitting(false);
        return;
      }
      formattedPhone = cleanPhone.startsWith('07') ? '+44' + cleanPhone.slice(1) : cleanPhone;
    }

    try {
      await inviteAdminUser({
        ...formData,
        phone: formattedPhone
      });
      setIsOpen(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', roleId: roles[0]?.id || '', primaryLocationId: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to invite user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-sm transition-colors text-sm flex items-center gap-2"
      >
        + Invite User
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">Invite User</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">First Name</label>
                  <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm" placeholder="First Name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Last Name</label>
                  <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm" placeholder="Last Name" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm" placeholder="Email" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Mobile Number <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm" placeholder="Mobile Number" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Role</label>
                  <select name="roleId" required value={formData.roleId} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm text-slate-700">
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Primary Location</label>
                  <select name="primaryLocationId" required value={formData.primaryLocationId} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm text-slate-700">
                    <option value="" disabled>Select location...</option>
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)} 
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 py-3 px-4 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-md disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}