import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { cards } from '@/lib/schema';
import { count, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { cardOwnerCondition, getAdminSession } from '@/lib/auth';
import {
  ADMIN_CACHE_TTL,
  getCachedValue,
  getCardQueryCacheVersion,
  setCachedValue,
} from '@/lib/redis';
import CardTable from '@/components/admin/CardTable';
import {
  CreditCard,
  CheckCircle,
  Hourglass,
  RocketLaunch,
  Plus,
  PaintBrushBroad,
  ArrowRight,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  const ownerCondition = cardOwnerCondition(session);
  const cacheVersion = await getCardQueryCacheVersion();
  const statsCacheKey = `admin:stats:${cacheVersion}:${session.role}:${session.userId}`;
  let stats = await getCachedValue<{
    total: number;
    active: number;
    unassigned: number;
    totalScans: number;
  }>(statsCacheKey);

  if (!stats) {
    const [result] = await db
      .select({
        total: count(),
        active: sql<number>`SUM(CASE WHEN ${cards.status} = 'active' THEN 1 ELSE 0 END)`,
        unassigned: sql<number>`SUM(CASE WHEN ${cards.status} = 'unassigned' THEN 1 ELSE 0 END)`,
        totalScans: sql<number>`SUM(${cards.totalScans})`,
      })
      .from(cards)
      .where(ownerCondition);

    stats = {
      total: Number(result.total),
      active: Number(result.active ?? 0),
      unassigned: Number(result.unassigned ?? 0),
      totalScans: Number(result.totalScans ?? 0),
    };
    await setCachedValue(statsCacheKey, stats, ADMIN_CACHE_TTL);
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitoring performa redirect kartu NFC & QR Google Review — TapFlow by InvictusWave
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/cards/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-all hover:shadow-lg"
          >
            <Plus size={16} weight="bold" />
            <span>Buat Kartu Baru</span>
          </Link>

          {session.role === 'super_admin' && (
            <Link
              href="/admin/templates"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors shadow-xs"
            >
              <PaintBrushBroad size={16} weight="bold" />
              <span>Galeri Desain</span>
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Kartu Dicetak',
            value: stats.total,
            icon: <CreditCard size={24} weight="duotone" className="text-blue-600 dark:text-blue-400" />,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
          },
          {
            label: 'Kartu Aktif',
            value: stats.active,
            icon: <CheckCircle size={24} weight="duotone" className="text-emerald-600 dark:text-emerald-400" />,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
          },
          {
            label: 'Belum Diaktivasi',
            value: stats.unassigned,
            icon: <Hourglass size={24} weight="duotone" className="text-amber-600 dark:text-amber-400" />,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
          },
          {
            label: 'Total Tap & Scan',
            value: stats.totalScans,
            icon: <RocketLaunch size={24} weight="duotone" className="text-purple-600 dark:text-purple-400" />,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {item.label}
              </p>
              <p className={`text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight ${item.color}`}>
                {item.value.toLocaleString('id-ID')}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${item.bg}`}>
              {item.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/cards/new"
          className="group p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Generator Kartu
            </span>
            <h3 className="text-lg font-bold mt-1">Buat Kartu Satuan atau Bulk</h3>
            <p className="text-xs text-blue-100 mt-1 max-w-sm">
              Input nama bisnis, pilih template, custom PIN & lokasi, atau cetak massal hingga 200 kartu.
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
            <ArrowRight size={20} weight="bold" />
          </div>
        </Link>

        {session.role === 'super_admin' && <Link
          href="/admin/templates"
          className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500 dark:hover:border-blue-500 transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Desain & Template
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              5 Template Akrilik & Smart Card
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              Pilihan desain Google Quad, White L-Stand eTTa, Glossy Black, Vertical PVC Card, & Royal Navy.
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center group-hover:translate-x-1 transition-transform">
            <ArrowRight size={20} weight="bold" />
          </div>
        </Link>}
      </div>

      {/* Main Table */}
      <CardTable />
    </div>
  );
}
