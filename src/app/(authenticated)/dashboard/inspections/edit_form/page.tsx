/**
 * Route: /dashboard/inspections/edit_form
 * Description: Server Component for Admin to edit the inspection form template (sections, questions).
 */
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditFormPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Check admin access
  const { data: profile } = await supabase
    .from('users')
    .select('roles(name)')
    .eq('id', user.id)
    .single();

  const roleData = profile?.roles as any;
  const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;

  if (roleName !== 'Admin') {
    redirect('/dashboard');
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Edit Form Template</h1>
        <p className="text-slate-500 mt-1">Manage sections and questions for the site inspection form.</p>
      </div>
    </div>
  );
}