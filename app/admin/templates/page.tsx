'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import GoogleBusinessSearch, { SelectedPlace } from '@/components/admin/GoogleBusinessSearch';
import { CustomTemplateData } from '@/types/template-builder';
import CanvasRenderer from '@/components/admin/builder/CanvasRenderer';
import {
  PaintBrushBroad,
  MagnifyingGlass,
  Sparkle,
  PencilSimple,
  Tag,
  WifiHigh,
  Lightning,
  Trash,
} from '@phosphor-icons/react';

export default function TemplatesGalleryPage() {
  const [mockBusiness, setMockBusiness] = useState('Kopi Kenangan');
  const [mockLocation, setMockLocation] = useState('Senopati, Jakarta');
  const [showBranding, setShowBranding] = useState(false);
  const [cardLang, setCardLang] = useState<'en' | 'id'>('en');
  const [customTemplates, setCustomTemplates] = useState<CustomTemplateData[]>([]);

  useEffect(() => {
    fetch('/api/admin/templates')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.templates) {
          setCustomTemplates(data.templates.filter((t: any) => t.isCustom));
        }
      })
      .catch(console.error);
  }, []);

  const handlePlaceSelect = (place: SelectedPlace) => {
    setMockBusiness(place.name);
    setMockLocation(place.location);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus template kustom ini?')) return;
    try {
      const res = await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
      } else {
        alert('Gagal menghapus template');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghapus template');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header & Template Studio CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Galeri Template & Studio Desain
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Koleksi template siap pakai & buat desain bebas kustom dengan visual drag-and-drop
          </p>
        </div>

        <Link
          href="/admin/templates/builder"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2.5 self-start sm:self-auto shrink-0"
        >
          <PaintBrushBroad size={20} weight="bold" />
          <span>Buka Template Studio</span>
        </Link>
      </div>

      {/* Live Customizer Bar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <MagnifyingGlass size={15} weight="bold" className="text-blue-500" />
            <span>Test Mockup dengan Bisnis Nyata:</span>
          </span>
          <button
            onClick={() => {
              setMockBusiness('');
              setMockLocation('');
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            Lihat Tampilan Polos (Tanpa Nama)
          </button>
        </div>
        <GoogleBusinessSearch onSelect={handlePlaceSelect} placeholder="Cari bisnis untuk melihat preview real-time..." />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <input
            type="text"
            value={mockBusiness}
            onChange={(e) => setMockBusiness(e.target.value)}
            placeholder="Ketik nama bisnis mockup..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={mockLocation}
            onChange={(e) => setMockLocation(e.target.value)}
            placeholder="Lokasi / Cabang mockup..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Language Selector */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Pilihan Bahasa Kartu (EN / ID)
            </span>
            <div className="flex p-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCardLang('en')}
                className={`px-3 py-1 rounded transition-all ${
                  cardLang === 'en'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                EN (English)
              </button>
              <button
                type="button"
                onClick={() => setCardLang('id')}
                className={`px-3 py-1 rounded transition-all ${
                  cardLang === 'id'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                ID (Indonesia)
              </button>
            </div>
          </div>

          {/* Branding Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Badge "powered by InvictusWave"
            </span>
            <input
              type="checkbox"
              checked={showBranding}
              onChange={(e) => setShowBranding(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* USER SAVED CUSTOM TEMPLATES SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkle size={20} weight="fill" className="text-amber-500" />
              <span>Semua Template</span>
              <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-full">
                {customTemplates.length}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {customTemplates.map((ct) => (
              <div
                key={ct.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/80 shadow-md flex flex-col items-center justify-between"
              >
                <div className="w-full flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white uppercase tracking-wider">
                      Studio Custom Design
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {ct.name}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {ct.aspect === 'vertical' ? '54 x 86 mm' : '100 x 100 mm'}
                  </span>
                </div>

                <div className="my-4 p-4 rounded-3xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center w-full shadow-inner h-[400px] overflow-hidden">
                  <div 
                    className="relative"
                    style={{ 
                      width: (ct.width || 500) * 0.65, 
                      height: (ct.height || 500) * 0.65 
                    }}
                  >
                    <div 
                      className="absolute inset-0 origin-top-left"
                      style={{ transform: 'scale(0.65)' }}
                    >
                      <CanvasRenderer
                        template={ct}
                        scale={1}
                        interactive={false}
                        mockData={{
                          businessName: mockBusiness,
                          location: mockLocation,
                          slug: 'demo-card',
                          url: 'https://tapflow.vercel.app/c/demo-card'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400 font-mono">
                    {ct.elements.length} Elemen Studio
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteTemplate(ct.id)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                      title="Hapus Template"
                    >
                      <Trash size={18} weight="bold" />
                    </button>
                    <Link
                      href={`/admin/templates/builder?id=${ct.id}`}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <PencilSimple size={14} weight="bold" />
                      <span>Edit</span>
                    </Link>
                    <Link
                      href={`/admin/cards/new?template=${ct.id}`}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap transition-colors shadow-xs"
                    >
                      Gunakan
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* Production Specs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Spesifikasi Produksi & Hardware NFC
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <Tag size={28} weight="duotone" className="text-blue-500" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-2">
              Ukuran Akrilik Stand & Kartu
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Stand Akrilik Meja (100x100mm) atau Kartu Saku PVC CR80 (54x86mm). Bahan akrilik 3mm UV print atau PVC matte tahan air.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <WifiHigh size={28} weight="duotone" className="text-emerald-500" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-2">
              Chip NFC NTAG213 / NTAG215
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Frekuensi 13.56 MHz. Pasang stiker NFC anti-metal di belakang ikon NFC agar responsif terbaca oleh smartphone iOS/Android.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <Lightning size={28} weight="duotone" className="text-amber-500" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-2">
              Writing NFC Tag
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tulis NDEF URL record <code className="text-blue-500">https://domain/c/[slug]</code> via aplikasi <em>NFC Tools</em>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
