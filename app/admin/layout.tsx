'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import { ThemeProvider } from '@/components/admin/ThemeProvider';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isStudioBuilder = pathname.startsWith('/admin/templates/builder');

  if (pathname === '/admin/login') {
    return <ThemeProvider>{children}</ThemeProvider>;
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 min-w-0 flex flex-col min-h-screen">
          {isStudioBuilder ? (
            <div className="flex-1 w-full h-screen flex flex-col overflow-hidden">
              {children}
            </div>
          ) : (
            <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 lg:pt-8">
              {children}
            </div>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}
