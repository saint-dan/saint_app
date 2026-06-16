'use client';

import React, { useState, useMemo } from 'react';
import { UserRow } from './page';
import { useRouter } from 'next/navigation';

type SortKey = 'name' | 'role' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface UsersTableProps {
  users: UserRow[] | null;
}

export default function UsersTable({ users }: UsersTableProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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
              <tr key={u.id} onClick={() => router.push(`/admin/users/${u.id}`)} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
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
    </>
  );
}