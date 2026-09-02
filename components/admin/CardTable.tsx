'use client';

import React, { useDeferredValue, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import QRExport from './QRExport';
import EditCardModal from './EditCardModal';
import NfcWriterModal from './NfcWriterModal';
import {
  Plus,
  DownloadSimple,
  MagnifyingGlass,
  MapPin,
  QrCode,
  PencilSimple,
  Key,
  Trash,
  CaretLeft,
  CaretRight,
  SpinnerGap,
  Broadcast,
} from '@phosphor-icons/react';

interface Card {
  id: string;
  slug: string;
  businessName: string | null;
  location: string | null;
  template: string | null;
  googleReviewUrl: string | null;
  status: 'active' | 'unassigned';
  totalScans: number;
  createdAt: number;
  updatedAt: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface TemplateOption {
  id: string;
  name: string;
}

export default function CardTable({ standalone = false }: { standalone?: boolean }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [qrCard, setQrCard] = useState<Card | null>(null);
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [nfcCard, setNfcCard] = useState<Card | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [showBulkQrModal, setShowBulkQrModal] = useState(false);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);

  useEffect(() => {
    fetch('/api/admin/templates')
      .then(res => res.ok ? res.json() : null)
      .then(data => setTemplates(data?.templates || []))
      .catch(console.error);
  }, []);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '15',
        status: statusFilter,
        template: templateFilter,
        ...(deferredSearchQuery ? { q: deferredSearchQuery } : {}),
      });

      const res = await fetch(`/api/admin/cards?${params.toString()}`);
      const data = await res.json();
      setCards(data.data || []);
      setPagination(data.pagination);
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, templateFilter, deferredSearchQuery]);

  useEffect(() => {
    // Fetching is the external synchronization; state updates happen after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCards();
  }, [fetchCards]);

  const handleResetPin = async (card: Card) => {
    if (!confirm(`Reset PIN kartu "${card.slug}"? Status kartu akan menjadi Belum Aktif dan cache akan di-refresh.`)) return;

    setResettingId(card.id);
    try {
      const res = await fetch(`/api/admin/cards/${card.id}/reset-pin`, { method: 'POST' });
      if (res.ok) {
        await fetchCards();
      }
    } finally {
      setResettingId(null);
    }
  };

  const handleDeleteCard = async (card: Card) => {
    if (!confirm(`Yakin ingin MENGHAPUS kartu "${card.slug}" secara permanen? Aksi ini tidak dapat dibatalkan.`)) return;

    setDeletingId(card.id);
    try {
      const res = await fetch(`/api/admin/cards/${card.id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCards();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const [appUrl] = useState(() => (typeof window !== 'undefined' ? window.location.origin : ''));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Manajemen Kartu NFC</span>
              <span className="px-2.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full font-semibold">
                {pagination?.total || 0}
              </span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Kelola URL redirect, monitor tap, dan ekspor kode QR.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedCards.length > 0 && (
              <button
                onClick={() => setShowBulkQrModal(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs"
              >
                <DownloadSimple size={16} weight="bold" />
                <span>Export {selectedCards.length} Kartu</span>
              </button>
            )}

            {!standalone && (
              <Link
                href="/admin/cards/new"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs"
              >
                <Plus size={16} weight="bold" />
                <span>Buat Kartu Baru</span>
              </Link>
            )}
            
            <a
              href="/api/admin/cards/export?format=csv"
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              <DownloadSimple size={16} weight="bold" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <MagnifyingGlass
              size={18}
              weight="bold"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari berdasarkan nama bisnis, lokasi, atau slug..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter status kartu"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="all">Semua Status (Aktif & Belum)</option>
              <option value="active">Aktif Saja</option>
              <option value="unassigned">Belum Aktif (Perlu Setup)</option>
            </select>
          </div>

          {/* Template Filter */}
          <div className="sm:col-span-3">
            <select
              value={templateFilter}
              onChange={(e) => {
                setTemplateFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter template kartu"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="all">Semua Template</option>
              {templates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

    {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 sm:px-6 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300"
                  checked={cards.length > 0 && selectedCards.length === cards.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedCards(cards.map(c => c.id));
                    else setSelectedCards([]);
                  }}
                />
              </th>
              <th className="px-4 py-3">Kode Kartu (Slug)</th>
              <th className="px-4 py-3">Bisnis & Lokasi</th>
              <th className="px-4 py-3">Template</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total Tap / Scan</th>
              <th className="px-4 py-3 hidden lg:table-cell">Dibuat Pada</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <SpinnerGap size={20} className="animate-spin text-blue-600" />
                    <span>Memuat data kartu...</span>
                  </div>
                </td>
              </tr>
            ) : cards.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Tidak ada kartu yang ditemukan</p>
                  <p className="text-xs mt-1">Coba ubah kata kunci pencarian atau filter status.</p>
                </td>
              </tr>
            ) : (
              cards.map((card) => {
                const tmpl = templates.find((t) => t.id === card.template);

                return (
                  <tr
                    key={card.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3.5 sm:px-6">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300"
                        checked={selectedCards.includes(card.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedCards([...selectedCards, card.id]);
                          else setSelectedCards(selectedCards.filter(id => id !== card.id));
                        }}
                      />
                    </td>
                    {/* Slug */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {card.slug}
                      </span>
                    </td>

                    {/* Business & Location */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {card.businessName || <span className="text-slate-400 italic">Belum Diisi</span>}
                      </div>
                      {card.location && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={12} weight="bold" className="text-slate-400 shrink-0" />
                          <span>{card.location}</span>
                        </p>
                      )}
                    </td>

                    {/* Template */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {tmpl?.name || card.template || 'Custom Template'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          card.status === 'active'
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                        }`}
                      >
                        {card.status === 'active' ? 'Aktif' : 'Belum Aktif'}
                      </span>
                    </td>

                    {/* Total Scans */}
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                      {card.totalScans.toLocaleString('id-ID')}
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-[11px] hidden lg:table-cell">
                      {formatDate(card.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* NFC Program & Link */}
                        <button
                          onClick={() => setNfcCard(card)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Program NFC & Link Aktivasi"
                        >
                          <Broadcast size={16} weight="bold" />
                        </button>

                        {/* View Print / QR */}
                        <button
                          onClick={() => setQrCard(card)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Lihat Desain & Cetak QR"
                        >
                          <QrCode size={16} weight="bold" />
                        </button>

                        {/* Edit Data */}
                        <button
                          onClick={() => setEditCard(card)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Data Kartu"
                        >
                          <PencilSimple size={16} weight="bold" />
                        </button>

                        {/* Reset PIN */}
                        <button
                          onClick={() => handleResetPin(card)}
                          disabled={resettingId === card.id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                          title="Reset PIN"
                        >
                          <Key size={16} weight="bold" />
                        </button>

                        {/* Delete Card */}
                        <button
                          onClick={() => handleDeleteCard(card)}
                          disabled={deletingId === card.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                          title="Hapus Kartu"
                        >
                          <Trash size={16} weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} total kartu)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <CaretLeft size={14} weight="bold" />
              <span>Sebelumnya</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <span>Berikutnya</span>
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* NFC Program & Copy Link Modal */}
      {nfcCard && (
        <NfcWriterModal
          card={nfcCard}
          appUrl={appUrl}
          onClose={() => setNfcCard(null)}
        />
      )}

      {/* QR & Print Modal */}
      {qrCard && (
        <QRExport
          cards={[qrCard]}
          appUrl={typeof window !== 'undefined' ? window.location.origin : 'https://tapflow.vercel.app'}
          onClose={() => setQrCard(null)}
        />
      )}

      {/* Edit Card Modal */}
      {editCard && (
        <EditCardModal
          card={editCard}
          onClose={() => setEditCard(null)}
          onSaved={fetchCards}
        />
      )}
      {showBulkQrModal && selectedCards.length > 0 && (
        <QRExport
          cards={cards.filter(c => selectedCards.includes(c.id))}
          appUrl={typeof window !== 'undefined' ? window.location.origin : 'https://tapflow.vercel.app'}
          onClose={() => setShowBulkQrModal(false)}
        />
      )}
    </div>
  );
}
