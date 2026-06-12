/**
 * Route: /dashboard/inspections
 * Description: Server Component displaying a list of Draft or Completed site inspections.
 * Includes server-side fetching and relational joins for Builder, Site, and Inspector.
 */
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import InspectionsList from '@/components/features/inspections/InspectionsList';

export const dynamic = 'force-dynamic';

export default async function InspectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const resolvedParams = await searchParams;
  // Default to Draft so clicking the generic link or landing here opens Drafts first
  const status = (resolvedParams?.status as string) || 'Draft';
  const query = (resolvedParams?.query as string) || '';

  // Fetch user role to determine data access
  const { data: profile } = await supabase
    .from('users')
    .select('roles(name)')
    .eq('id', user.id)
    .single();

  const roleData = profile?.roles as any;
  const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;

  // Fetch inspections based on status with related table data
  const baseQuery = supabase
    .from('site_inspections')
    .select(`
      id,
      inspection_date,
      status,
      builders (name),
      sites (name),
      users (first_name, last_name)
    `)
    .eq('status', status);

  const { data: inspections } = await (roleName === 'Contracts Manager'
    ? baseQuery.eq('inspector_id', user.id)
    : baseQuery
  ).order('inspection_date', { ascending: false });

  // In-memory filter for the search query to handle relational columns easily
  let filteredInspections = inspections || [];
  if (query) {
    const lowerQuery = query.toLowerCase();
    filteredInspections = filteredInspections.filter(i => {
      const getNestedName = (obj: any) => {
        if (!obj) return '';
        if (Array.isArray(obj)) return obj[0]?.name || '';
        return obj.name || '';
      };
      
      const getUserName = (obj: any) => {
         if (!obj) return '';
         if (Array.isArray(obj)) return `${obj[0]?.first_name || ''} ${obj[0]?.last_name || ''}`;
         return `${obj.first_name || ''} ${obj.last_name || ''}`;
      };

      const builderName = getNestedName(i.builders).toLowerCase();
      const siteName = getNestedName(i.sites).toLowerCase();
      const inspectorName = getUserName(i.users).toLowerCase();
      
      return builderName.includes(lowerQuery) || siteName.includes(lowerQuery) || inspectorName.includes(lowerQuery);
    });
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <InspectionsList 
        initialInspections={filteredInspections} 
        currentStatus={status} 
        currentQuery={query}
      />
    </div>
  );
}