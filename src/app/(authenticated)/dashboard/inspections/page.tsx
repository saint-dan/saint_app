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

type SearchParams = { status?: string; query?: string };

export default async function InspectionsPage(props: {
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const searchParams = await props.searchParams;
  // Default to Draft so clicking the generic link or landing here opens Drafts first
  const status = searchParams?.status || 'Draft';
  const query = searchParams?.query || '';

  // Fetch inspections based on status with related table data
  const { data: inspections } = await supabase
    .from('site_inspections')
    .select(`
      id,
      inspection_date,
      status,
      builders (name),
      sites (name),
      users (first_name, last_name)
    `)
    .eq('status', status)
    .order('inspection_date', { ascending: false });

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
    <InspectionsList 
      initialInspections={filteredInspections} 
      currentStatus={status} 
      currentQuery={query}
    />
  );
}