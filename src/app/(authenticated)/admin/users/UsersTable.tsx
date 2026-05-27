'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { UserRow } from './page';
import { getUserDetails, updateUserStatus } from './actions';

type SortKey = 'name' | 'role' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface UsersTableProps {
  users: UserRow[] | null;
}

export default function UsersTable({ users }: UsersTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isPending, startTransition] = useTransition();

  const openDrawer = async (id: string) => {
    setSelectedUserId(id);
    setIsDrawerOpen(true);
    setIsLoadingDetails(true);
    setUserDetails(null);
    
    try {
      const data = await getUserDetails(id);
      setUserDetails(data);
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedUserId(null);
      setUserDetails(null);
    }, 300); // Wait for slide-out animation to finish
  };

  const handleStatusChange = (newStatus: 'Active' | 'Rejected') => {
    if (!userDetails) return;
    startTransition(async () => {
      try {
        await updateUserStatus(userDetails.id, newStatus);
        setUserDetails({ ...userDetails, status: newStatus });
      } catch (error) {
        console.error("Failed to update status", error);
      }
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedUsers = useMemo(() => {
    if (!users) return [];
    return [...users].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      if (sortKey === 'name') {
        aValue = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
        bValue = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
      } else if (sortKey === 'role') {
        const aRole = Array.isArray(a.roles) ? a.roles[0]?.name : a.roles?.name;
        const bRole = Array.isArray(b.roles) ? b.roles[0]?.name : b.roles?.name;
        aValue = (aRole || '').toLowerCase();
        bValue = (bRole || '').toLowerCase();
      } else if (sortKey === 'status') {
        aValue = (a.status || 'Pending').toLowerCase();
        bValue = (b.status || 'Pending').toLowerCase();
      } else if (sortKey === 'created_at') {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, sortKey, sortDirection]);

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    const isActive = sortKey === columnKey;
    return (
      <div className={`flex flex-col items-center -space-y-[3px] transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-[14px] w-[14px] ${isActive && sortDirection === 'asc' ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-[14px] w-[14px] ${isActive && sortDirection === 'desc' ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    );
  };

  const SortableHeader = ({ label, columnKey }: { label: string; columnKey: SortKey }) => (
    <th 
      className="py-4 px-8 sm:px-10 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100/50 transition-colors group"
      onClick={() => handleSort(columnKey)}
    >
      <div className="flex items-center gap-1.5">
        {label}
        <SortIcon columnKey={columnKey} />
      </div>
    </th>
  );

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100">
            <SortableHeader label="Name" columnKey="name" />
            <SortableHeader label="Role" columnKey="role" />
            <SortableHeader label="Status" columnKey="status" />
            <SortableHeader label="Created" columnKey="created_at" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedUsers.map((u) => {
            const roleData = u.roles;
            const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;
            
            const statusStyle = u.status === 'Active' 
              ? 'bg-green-100 text-green-700 border-green-200' 
              : u.status === 'Pending'
              ? 'bg-amber-100 text-amber-700 border-amber-200'
              : 'bg-slate-100 text-slate-700 border-slate-200';

            return (
              <tr key={u.id} onClick={() => openDrawer(u.id)} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                <td className="py-5 px-8 sm:px-10">
                  <div className="font-bold text-slate-900">{u.first_name} {u.last_name}</div>
                </td>
                <td className="py-5 px-8 sm:px-10">
                  <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {roleName || 'Unassigned'}
                  </span>
                </td>
                <td className="py-5 px-8 sm:px-10">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusStyle}`}>
                    {u.status || 'Pending'}
                  </span>
                </td>
                <td className="py-5 px-8 sm:px-10 text-sm font-medium text-slate-500">
                  {new Date(u.created_at).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
              </tr>
            );
          })}
          {(!sortedUsers || sortedUsers.length === 0) && (
            <tr>
              <td colSpan={4} className="py-12 text-center text-slate-500 font-medium">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

      {/* --- Slide-Out Drawer Overlay --- */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={closeDrawer} 
      />

      {/* --- Slide-Out Drawer Panel --- */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md md:max-w-lg bg-white shadow-2xl border-l border-slate-100 transform transition-transform duration-300 ease-in-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex-1 overflow-y-auto">
          {/* Drawer Header */}
          <div className="sticky top-0 z-10 px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">User Profile</h2>
            <button onClick={closeDrawer} className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isLoadingDetails ? (
            // Loading Skeleton
            <div className="p-6 space-y-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-200"></div>
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-slate-200 rounded"></div>
                  <div className="h-3 w-24 bg-slate-200 rounded"></div>
                </div>
              </div>
              <div className="h-40 bg-slate-100 rounded-2xl"></div>
              <div className="h-48 bg-slate-100 rounded-2xl"></div>
            </div>
          ) : userDetails ? (
            // Full Profile Content
            <div className="p-6 space-y-6">
              
              {/* Overview */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 text-xl font-bold border-2 border-white shadow-sm">
                  {userDetails.first_name?.charAt(0)}{userDetails.last_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{userDetails.first_name} {userDetails.last_name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                      {Array.isArray(userDetails.roles) ? userDetails.roles[0]?.name : userDetails.roles?.name || 'Unassigned'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${userDetails.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : userDetails.status === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {userDetails.status || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Primary Location</p>
                  <p className="font-medium text-slate-900 mt-0.5">
                    {Array.isArray(userDetails.locations) ? userDetails.locations[0]?.name : userDetails.locations?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Email Address</p>
                  <p className="font-medium text-slate-900 mt-0.5">{userDetails.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Mobile number</p>
                  <p className="font-medium text-slate-900 mt-0.5">{userDetails.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Address</p>
                  <p className="font-medium text-slate-900 mt-0.5 whitespace-pre-line">{userDetails.address || 'N/A'}</p>
                </div>
              </div>

              {/* Tax & Business Profile */}
              {(Array.isArray(userDetails.roles) ? userDetails.roles[0]?.name : userDetails.roles?.name) === 'Contractor' && (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Contractor Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">Account Type</p>
                      <p className="font-medium text-slate-900 mt-0.5">{userDetails.account_type || 'N/A'}</p>
                    </div>
                    {userDetails.account_type === 'Limited Company' ? (
                      <>
                        <div><p className="text-xs font-semibold text-slate-500 uppercase">Company Name</p><p className="font-medium text-slate-900 mt-0.5">{userDetails.company_name || 'N/A'}</p></div>
                        <div><p className="text-xs font-semibold text-slate-500 uppercase">Reg Number</p><p className="font-medium text-slate-900 mt-0.5">{userDetails.company_reg_number || 'N/A'}</p></div>
                      </>
                    ) : (
                      <div><p className="text-xs font-semibold text-slate-500 uppercase">National Insurance</p><p className="font-medium text-slate-900 mt-0.5 uppercase">{userDetails.national_insurance || 'N/A'}</p></div>
                    )}
                    <div><p className="text-xs font-semibold text-slate-500 uppercase">UTR Number</p><p className="font-medium text-slate-900 mt-0.5">{userDetails.utr_number || 'N/A'}</p></div>
                    <div><p className="text-xs font-semibold text-slate-500 uppercase">CIS Status</p><p className="font-medium text-slate-900 mt-0.5">{userDetails.cis_status || 'N/A'}</p></div>
                  </div>
                </div>
              )}

            </div>
          ) : null}
        </div>

        {/* Drawer Action Bar */}
        {userDetails && userDetails.status === 'Pending' && (
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 mt-auto">
            <button onClick={() => handleStatusChange('Active')} disabled={isPending} className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50">
              {isPending ? 'Processing...' : 'Approve'}
            </button>
            <button onClick={() => handleStatusChange('Rejected')} disabled={isPending} className="flex-1 py-3 px-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl shadow-sm transition-all disabled:opacity-50">
              Reject
            </button>
          </div>
        )}
      </div>
    </>
  );
}