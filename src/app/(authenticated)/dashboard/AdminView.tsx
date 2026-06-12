import React from 'react';
import { UserProfile } from './page';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export default async function AdminView({ profile }: { profile: UserProfile | null }) {
  // Use the service_role key to bypass Row Level Security (RLS) for accurate counts
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { count: pendingCount } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Pending');

  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Admin Portal
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            Manage contractor registrations, verify documents, and oversee platform activity.
          </p>
        </div>
      </div>
      
      {/* Admin Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl border border-amber-100 hover:shadow-md transition-shadow">
          <h3 className="font-bold text-amber-900 mb-2">Pending Registrations</h3>
          <p className="text-amber-700 text-4xl font-extrabold tracking-tight">{pendingCount || 0}</p>
        </div>
        
        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl border border-green-100 hover:shadow-md transition-shadow">
          <h3 className="font-bold text-green-900 mb-2">Active Contractors</h3>
          <p className="text-green-700 text-4xl font-extrabold tracking-tight">0</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
          <h3 className="font-bold text-slate-800 mb-2">Open Jobs</h3>
          <p className="text-slate-700 text-4xl font-extrabold tracking-tight">0</p>
        </div>
      </div>
    </div>
  );
}