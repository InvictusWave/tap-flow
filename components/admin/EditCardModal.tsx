'use client';

import React, { useState, useEffect } from 'react';
// No longer using CardTemplatePreview
import GoogleBusinessSearch, { SelectedPlace } from './GoogleBusinessSearch';
import { X, MagnifyingGlass } from '@phosphor-icons/react';
import { CustomTemplateData } from '@/types/template-builder';
import CanvasRenderer from './builder/CanvasRenderer';

interface CardData {
  id: string;
  slug: string;
  businessName: string | null;
  location: string | null;
  template: string | null;
  googleReviewUrl: string | null;
  status: 'active' | 'unassigned';
  totalScans: number;
}

interface EditCardModalProps {
  card: CardData;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditCardModal({ card, onClose, onSaved }: EditCardModalProps) {
  const [businessName, setBusinessName] = useState(card.businessName || '');
  const [location, setLocation] = useState(card.location || '');
  const [googleReviewUrl, setGoogleReviewUrl] = useState(card.googleReviewUrl || '');
  const [template, setTemplate] = useState(card.template || 'google_quad');
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'active' | 'unassigned'>(card.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customTemplatesList, setCustomTemplatesList] = useState<CustomTemplateData[]>([]);
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    setAppUrl(window.location.origin);
    fetch('/api/admin/templates')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.templates) {
          setCustomTemplatesList(data.templates.filter((t: any) => t.isCustom));
        }
      })
      .catch(console.error);
  }, []);

  const handlePlaceSelect = (place: SelectedPlace) => {
    setBusinessName(place.name);
    setLocation(place.location);
    setGoogleReviewUrl(place.googleReviewUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/cards/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          location,
          googleReviewUrl,
          template,
          status,
          ...(pin ? { pin } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal menyimpan perubahan.');
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-7 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Edit Data Kartu
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Slug: <span className="text-blue-600 dark:text-blue-400 font-bold">{card.slug}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Google Places search helper inside edit modal */}
        <div className="mt-4 p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200 mb-1.5 flex items-center gap-1.5">
            <MagnifyingGlass size={14} weight="bold" />
            <span>Cari & Update via Google Maps:</span>
          </label>
          <GoogleBusinessSearch onSelect={handlePlaceSelect} placeholder="Ketik nama bisnis untuk auto-update..." />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Nama Bisnis
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Kosongkan jika tanpa nama bisnis"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Lokasi / Cabang
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="misal: Jakarta Selatan"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Google Review URL
            </label>
            <input
              type="url"
              value={googleReviewUrl}
              onChange={(e) => setGoogleReviewUrl(e.target.value)}
              placeholder="https://g.page/r/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Template Desain
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            >
              {customTemplatesList.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name}
                </option>
              ))}
            </select>
            
            {/* Template Preview */}
            <div className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-inner">
              {(() => {
                const activeTemplate = customTemplatesList.find(ct => ct.id === template);
                if (!activeTemplate) return null;
                
                return (
                  <div className="transform scale-[0.6] origin-center -m-10">
                    <CanvasRenderer
                      template={activeTemplate}
                      scale={1}
                      interactive={false}
                      mockData={{ 
                        businessName, 
                        location, 
                        slug: card.slug,
                        url: appUrl ? `${appUrl}/c/${card.slug}` : `https://tapflow.vercel.app/c/${card.slug}` 
                      }}
                    />
                  </div>
                );
              })()}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Ganti 6-Digit PIN <span className="text-slate-400 font-normal lowercase">(kosongkan jika tidak diubah)</span>
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="6 digit angka baru"
              maxLength={6}
              pattern="\d{6}"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Status Kartu
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'unassigned')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Aktif (Direct Redirect)</option>
              <option value="unassigned">Belum Aktif (Redirect ke Form Aktivasi)</option>
            </select>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
