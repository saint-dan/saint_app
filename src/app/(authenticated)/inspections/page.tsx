/**
 * Route: /dashboard/inspections
 * Description: Server Component displaying a list of Draft or Completed site inspections.
 * Includes server-side fetching and relational joins for Builder, Site, and Inspector.
 */
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import InspectionsList from '@/components/features/inspections/InspectionsList';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

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
  // Default to Completed so clicking the generic link or landing here opens Completed first
  const status = (resolvedParams?.status as string) || 'Completed';
  const query = (resolvedParams?.query as string) || '';
  const page = parseInt((resolvedParams?.page as string) || '1', 10);
  const sortField = (resolvedParams?.sortField as string) || 'date';
  const sortOrder = (resolvedParams?.sortOrder as string) || 'desc';
  const inspectorIdFilter = (resolvedParams?.inspectorId as string) || '';

  // Fetch user role to determine data access
  const { data: profile } = await supabase
    .from('users')
    .select('roles(name)')
    .eq('id', user.id)
    .single();

  const roleData = profile?.roles as any;
  const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;

  // Decide which Supabase client to use. For Admins, we use the service_role client
  // to bypass RLS and fetch all inspector names for the filter dropdown.
  // This is safe as it's a Server Component and the key is not exposed to the client.
  const queryClient = (roleName === 'Admin' 
    ? createAdminClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    : supabase) as unknown as ReturnType<typeof createAdminClient<Database>>;

  // Fetch inspections based on status with related table data
  const inspectionQuery = queryClient
    .from('site_inspections')
    .select(`
      id,
      inspection_date,
      created_at,
      status,
      pdf_url,
      inspector_id,
      builders(name),
      sites(name),
      users(first_name, last_name)
    `)
    .eq('status', status);

  // For non-admins, we still need to filter by their own ID.
  // The Admin query (using service_role) will fetch all, which is what we want.
  const finalQuery = roleName === 'Contracts Manager' 
    ? inspectionQuery.eq('inspector_id', user.id)
    : inspectionQuery;

  const { data: inspections } = await finalQuery.order('created_at', { ascending: false });

  // Helpers for extracting names from relational columns
  const getNestedName = (obj: any) => {
    if (!obj) return '';
    if (Array.isArray(obj)) return obj[0]?.name || '';
    return obj.name || '';
  };
  
  const getUserName = (obj: any) => {
     if (!obj) return '';
     if (Array.isArray(obj)) return `${obj[0]?.first_name || ''} ${obj[0]?.last_name || ''}`.trim();
     return `${obj.first_name || ''} ${obj.last_name || ''}`.trim();
  };

  // Extract unique inspectors for the admin filter dropdown
  const uniqueInspectorsMap = new Map<string, string>();
  inspections?.forEach(i => {
    if (i.users && i.inspector_id) {
      uniqueInspectorsMap.set(i.inspector_id, getUserName(i.users));
    }
  });
  const inspectorsList = Array.from(uniqueInspectorsMap.entries()).map(([id, name]) => ({ id, name }));
  inspectorsList.sort((a, b) => a.name.localeCompare(b.name));

  // In-memory filter for the search query to handle relational columns easily
  let filteredInspections = inspections || [];
  
  if (inspectorIdFilter) {
    filteredInspections = filteredInspections.filter(i => i.inspector_id === inspectorIdFilter);
  }
  
  if (query) {
    const lowerQuery = query.toLowerCase();
    filteredInspections = filteredInspections.filter(i => {
      const builderName = getNestedName(i.builders).toLowerCase();
      const siteName = getNestedName(i.sites).toLowerCase();
      const inspectorName = getUserName(i.users).toLowerCase();
      
      return builderName.includes(lowerQuery) || siteName.includes(lowerQuery) || inspectorName.includes(lowerQuery);
    });
  }

  // Apply Sorting
  filteredInspections.sort((a, b) => {
    let valA = '';
    let valB = '';

    switch (sortField) {
      case 'builder': valA = getNestedName(a.builders).toLowerCase(); valB = getNestedName(b.builders).toLowerCase(); break;
      case 'site': valA = getNestedName(a.sites).toLowerCase(); valB = getNestedName(b.sites).toLowerCase(); break;
      case 'inspector': valA = getUserName(a.users).toLowerCase(); valB = getUserName(b.users).toLowerCase(); break;
      case 'date':
      default:
        valA = a.created_at || '';
        valB = b.created_at || '';
        break;
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination logic (10 rows per page)
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage);
  const paginatedInspections = filteredInspections.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <InspectionsList 
        initialInspections={paginatedInspections} 
        currentStatus={status} 
        currentQuery={query}
        currentPage={page}
        totalPages={totalPages}
        currentSortField={sortField}
        currentSortOrder={sortOrder}
        roleName={roleName}
        inspectors={inspectorsList}
        currentInspectorId={inspectorIdFilter}
      />
    </div>
  );
}