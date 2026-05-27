import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import TopNavbar from '@/components/TopNavbar';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, roles(name)')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopNavbar email={user.email} profile={profile} />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}