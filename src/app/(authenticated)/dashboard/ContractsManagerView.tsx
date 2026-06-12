import React from 'react';
import Link from 'next/link';
import { UserProfile } from './page';

export default function ContractsManagerView({ profile }: { profile: UserProfile | null }) {
  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {profile?.first_name || 'Contracts Manager'}!
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            Manage site allocations, oversee subcontractor activity, and track project progress.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link
            href="/dashboard/inspections/new"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-sm transition-all text-sm flex items-center gap-2 whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            New Inspection
          </Link>
          <div className="px-4 py-2 rounded-xl font-bold text-sm border shadow-sm flex items-center gap-2 bg-purple-50 text-purple-700 border-purple-100">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            Contracts Manager
          </div>
        </div>
      </div>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-100 hover:shadow-md transition-shadow">
          <h3 className="font-bold text-blue-900 mb-2">Active Sites</h3>
          <p className="text-blue-700 text-4xl font-extrabold tracking-tight">0</p>
        </div>
        
        <div className="p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl border border-amber-100 hover:shadow-md transition-shadow">
          <h3 className="font-bold text-amber-900 mb-2">Pending Approvals</h3>
          <p className="text-amber-700 text-4xl font-extrabold tracking-tight">0</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
          <h3 className="font-bold text-slate-800 mb-2">Active Subcontractors</h3>
          <p className="text-slate-700 text-4xl font-extrabold tracking-tight">0</p>
        </div>
      </div>
    </div>
  );
}