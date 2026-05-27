'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TopNavbar({ email, profile }: { email?: string, profile: any }) {
  const router = useRouter();
  const supabase = createClient();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Safely extract the role name, handling both object and array formats
  const roleData = profile?.roles;
  const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 flex justify-between items-center relative">
        
        {/* Left: Logo */}
        <Link href="/dashboard" className="flex items-center hover:opacity-90 transition-opacity relative z-10">
          <img 
            src="https://6548935.app.netsuite.com/core/media/media.nl?id=12904734&c=6548935&h=lTRR7c30QxWFNVKbRyFb33OSd6KKQTdFVchouUxSK4Am28ls" 
            alt="Saint Flooring Logo" 
            className="w-14 sm:w-16 h-auto object-contain"
          />
        </Link>

        {/* Center: Title */}
        <Link href="/dashboard" className="hidden sm:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-base sm:text-lg font-bold tracking-tight text-white hover:opacity-90 transition-opacity whitespace-nowrap">
          Contractor App
        </Link>

        {/* Profile Menu */}
        <div className="relative z-10">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 p-1 pr-3 rounded-full border border-transparent hover:bg-blue-700/50 hover:border-blue-500 focus:outline-none transition-all duration-200"
          >
            <div className="w-8 h-8 text-sm rounded-full bg-white flex items-center justify-center text-blue-700 font-bold shadow-sm border-white">
              {profile?.first_name?.charAt(0).toUpperCase() || email?.charAt(0).toUpperCase() || '?'}
            </div>
            <span className="hidden sm:block text-sm font-semibold text-white">
              {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : email}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Overlay & Menu */}
          {isProfileMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsProfileMenuOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-2 z-50 transform origin-top-right transition-all">
                <div className="px-4 py-3 border-b border-slate-100 mb-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Signed in as</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{email}</p>
                  {roleName && (
                    <div className="mt-2 inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-slate-200">
                      {roleName}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    router.push('/dashboard');
                  }}
                  className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-4 h-4 mr-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                  Dashboard
                </button>

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    router.push('/profile');
                  }}
                  className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-4 h-4 mr-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Profile
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-4 h-4 mr-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}