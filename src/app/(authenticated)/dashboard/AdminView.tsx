import React from 'react';
import Link from 'next/link';
import { UserProfile } from './page';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export default async function AdminView({ profile }: { profile: UserProfile | null }) {
  // Use the service_role key to bypass Row Level Security (RLS) for accurate counts
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { count: draftCount } = await supabaseAdmin
    .from('inspections')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Draft');
    
  const { count: completedCount } = await supabaseAdmin
    .from('inspections')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Completed');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 sm:px-12">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {profile?.first_name || 'Admin'}!
          </h2>
        </div>
      </div>
      
      {/* Inspection Reports Section */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
          <h3 className="text-xl font-bold text-slate-900">Inspection Reports</h3>
          <div className="flex items-center">
            <Link
              href="/inspections/new"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-sm transition-all text-sm flex items-center gap-2 whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              New Inspection
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/inspections?status=Draft" className="block p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl border border-amber-100 hover:shadow-md hover:border-amber-200 transition-all cursor-pointer group">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-amber-900 mb-2 group-hover:text-amber-700 transition-colors">Draft</h4>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-amber-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
            <p className="text-amber-700 text-4xl font-extrabold tracking-tight">{draftCount || 0}</p>
          </Link>
          
          <Link href="/inspections?status=Completed" className="block p-6 bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl border border-green-100 hover:shadow-md hover:border-green-200 transition-all cursor-pointer group">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-green-900 mb-2 group-hover:text-green-700 transition-colors">Completed</h4>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
            <p className="text-green-700 text-4xl font-extrabold tracking-tight">{completedCount || 0}</p>
          </Link>
        </div>
      </div>
    </div>
  );
}