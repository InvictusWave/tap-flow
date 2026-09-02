'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import LogoutButton from '@/app/admin/LogoutButton';
import {
  SquaresFour,
  CreditCard,
  PlusCircle,
  PaintBrushBroad,
  Image as ImageIcon,
  List,
  X,
  Lightning,
  UsersThree,
} from '@phosphor-icons/react';

const navItems = [
  {
    label: 'Overview',
    href: '/admin',
    icon: <SquaresFour size={20} weight="duotone" />,
  },
  {
    label: 'Manajemen Kartu',
    href: '/admin/cards',
    icon: <CreditCard size={20} weight="duotone" />,
  },
  {
    label: 'Buat Kartu Baru',
    href: '/admin/cards/new',
    icon: <PlusCircle size={20} weight="duotone" />,
    badge: 'Baru',
  },
  {
    label: 'Template Studio',
    href: '/admin/templates/builder',
    icon: <PaintBrushBroad size={20} weight="duotone" />,
    badge: 'Studio',
    superOnly: true,
  },
  {
    label: 'Galeri Desain',
    href: '/admin/templates',
    icon: <ImageIcon size={20} weight="duotone" />,
    superOnly: true,
  },
  {
    label: 'Manajemen Admin',
    href: '/admin/admins',
    icon: <UsersThree size={20} weight="duotone" />,
    superOnly: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: 'super_admin' | 'admin' } | null>(null);

  useEffect(() => {
    fetch('/api/admin/auth')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setUser(data?.user ?? null));
  }, []);

  // Precise route matching helper to avoid parent/child overlapping active states
  const isItemActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    if (href === '/admin/templates') {
      return pathname === '/admin/templates';
    }
    if (href === '/admin/cards') {
      return pathname === '/admin/cards';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top brand */}
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Lightning size={20} weight="fill" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  Tap<span className="text-blue-500">Flow</span>
                </span>
                <p className="text-[10px] text-slate-400 font-medium">InvictusWave</p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.filter((item) => !item.superOnly || user?.role === 'super_admin').map((item) => {
              const isActive = isItemActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Theme toggle & User logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Tema Tampilan
            </span>
            <ThemeToggle />
          </div>

          <div className="pt-2 flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="text-xs">
                <p className="font-medium text-slate-800 dark:text-slate-200">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-slate-400">
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
