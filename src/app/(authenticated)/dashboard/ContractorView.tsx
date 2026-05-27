import React from 'react';
import { UserProfile } from './page';

export default function ContractorView({ profile }: { profile: UserProfile | null }) {
  const status = profile?.status || 'Pending';
  const statusStyle = status === 'Active' 
    ? 'bg-green-100 text-green-700 border-green-200' 
    : 'bg-amber-100 text-amber-700 border-amber-200';

  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {profile?.first_name || 'Contractor'}!
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            This is your central hub for managing your contractor profile and viewing upcoming jobs.
          </p>
        </div>
        <div className={`px-4 py-2 rounded-xl font-bold text-sm border shadow-sm flex items-center gap-2 ${statusStyle}`}>
          <div className={`w-2 h-2 rounded-full ${status === 'Active' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
          {status} Profile
        </div>
      </div>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-100 hover:shadow-md transition-shadow">
          <h3 className="font-bold text-blue-900 mb-2">Active Jobs</h3>
          <p className="text-blue-700 text-4xl font-extrabold tracking-tight">0</p>
        </div>
        
        <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
          <h3 className="font-bold text-slate-800 mb-2">Pending Invoices</h3>
          <p className="text-slate-700 text-4xl font-extrabold tracking-tight">0</p>
        </div>
      </div>
    </div>
  );
}