'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import CanvasRenderer from '@/components/admin/builder/CanvasRenderer';
import GoogleBusinessSearch, { SelectedPlace } from '@/components/admin/GoogleBusinessSearch';
import { generateSlug } from '@/lib/utils';
import { isDirectGoogleReviewUrl } from '@/lib/google-review';
import QRExport from '@/components/admin/QRExport';
import { CustomTemplateData } from '@/types/template-builder';
import { DEFAULT_BULK_TEMPLATE_ID, DEFAULT_TEMPLATE_ID, TEMPLATE_PRESETS } from '@/lib/template-presets';
import {
  PlusCircle,
  Lightning,
  MagnifyingGlass,
  DiceFive,
  Check,
  DownloadSimple,
  PaintBrushBroad,
  ArrowLeft,
  CheckCircle,
} from '@phosphor-icons/react';

function CreateCardContent() {
  type TemplateOption = CustomTemplateData & { isCustom?: boolean };
  type CreatedCard = {
    id: string;
    slug: string;
    businessName: string | null;
    location: string | null;
    template: string | null;
    status: 'active' | 'unassigned';
    totalScans: number;
  };
  type BulkCard = {
    slug: string;
    url: string;
    activateUrl: string;
    template: string;
  };

  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // Single Card Form State
  const [slug, setSlug] = useState(() => generateSlug(8));
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [pin, setPin] = useState('');
  const [showBranding, setShowBranding] = useState(false);
  const [cardLang, setCardLang] = useState<'en' | 'id'>('en');
  const [selectedTemplate, setSelectedTemplate] = useState(() => searchParams.get('template') || DEFAULT_TEMPLATE_ID);
  const [loadingSingle, setLoadingSingle] = useState(false);
  const [singleMessage, setSingleMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [createdCard, setCreatedCard] = useState<CreatedCard | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [customTemplatesList, setCustomTemplatesList] = useState<TemplateOption[]>([]);

  // Bulk Generator State
  const [bulkCount, setBulkCount] = useState(25);
  const [bulkTemplate, setBulkTemplate] = useState(DEFAULT_BULK_TEMPLATE_ID);
  const [bulkLocation, setBulkLocation] = useState('');
  const [loadingBulk, setLoadingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkCard[] | null>(null);
  const [bulkError, setBulkError] = useState('');
  const [appUrl] = useState(() => (typeof window !== 'undefined' ? window.location.origin : ''));
  const availableTemplates: TemplateOption[] = [
    ...TEMPLATE_PRESETS.map((template) => ({ ...template, isCustom: false })),
    ...customTemplatesList,
  ];

  useEffect(() => {
    fetch('/api/admin/templates')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.templates) {
          setCustomTemplatesList(data.templates.filter((t: TemplateOption) => t.isCustom));
        }
      })
      .catch(console.error);
  }, []);

  // Handle Autocomplete selection from Google Business Search
  const handlePlaceSelect = (place: SelectedPlace) => {
    setBusinessName(place.name);
    setLocation(place.location);
    setGoogleReviewUrl(
      isDirectGoogleReviewUrl(place.googleReviewUrl) ? place.googleReviewUrl : ''
    );
    if (place.recommendedSlug) {
      setSlug(place.recommendedSlug);
    }
  };

  // Handle Single Card Submit
  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (googleReviewUrl && !isDirectGoogleReviewUrl(googleReviewUrl)) {
      setSingleMessage({
        type: 'error',
        text: 'Gunakan link "Minta ulasan" resmi, bukan URL profil Google Maps.',
      });
      return;
    }
    setLoadingSingle(true);
    setSingleMessage(null);

    try {
      const res = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          businessName,
          location,
          googleReviewUrl,
          pin,
          template: selectedTemplate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSingleMessage({ type: 'error', text: data.error || 'Gagal membuat kartu.' });
        return;
      }

      setCreatedCard(data.data);
      setSingleMessage({
        type: 'success',
        text: `Kartu "${slug}" berhasil dibuat dan siap digunakan!`,
      });
    } catch {
      setSingleMessage({ type: 'error', text: 'Terjadi kesalahan saat menghubungi server.' });
    } finally {
      setLoadingSingle(false);
    }
  };

  const handleResetForm = () => {
    setSlug(generateSlug(8));
    setBusinessName('');
    setLocation('');
    setGoogleReviewUrl('');
    setPin('');
    setCreatedCard(null);
    setSingleMessage(null);
  };

  // Handle Bulk Generate
  const handleBulkGenerate = async () => {
    setLoadingBulk(true);
    setBulkError('');
    setBulkResult(null);

    try {
      const res = await fetch('/api/admin/cards/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: bulkCount,
          template: bulkTemplate,
          location: bulkLocation,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBulkError(data.error || 'Gagal generate bulk kartu.');
        return;
      }

      setBulkResult(data.cards);
    } catch {
      setBulkError('Gagal terhubung ke server.');
    } finally {
      setLoadingBulk(false);
    }
  };

  const handleDownloadBulkCsv = () => {
    if (!bulkResult) return;
    const headers = ['Slug', 'NFC Redirect URL', 'Activate URL', 'Template'];
    const rows = bulkResult.map((c) => [c.slug, c.url, c.activateUrl, c.template]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tapflow-bulk-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
            <Link href="/admin/cards" className="hover:underline flex items-center gap-1">
              <ArrowLeft size={14} weight="bold" />
              <span>Manajemen Kartu</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Buat Kartu Baru
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cari bisnis di Google Maps untuk auto-fill data, pilih template preset / kustom Template Studio, atau generate massal.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-sm font-medium">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'single'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PlusCircle size={16} weight="bold" />
            <span>Buat Satuan</span>
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'bulk'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lightning size={16} weight="bold" />
            <span>Bulk Generator</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SINGLE CARD CREATION                                               */}
      {/* ========================================================================= */}
      {activeTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Left Column */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
            {/* Google Business Search Autocomplete */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-800/50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <MagnifyingGlass size={15} weight="bold" />
                  <span>Cari Bisnis di Google Maps (Auto-fill)</span>
                </label>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  Cepat & Otomatis
                </span>
              </div>
              <GoogleBusinessSearch onSelect={handlePlaceSelect} />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ketik nama bisnis untuk mengisi otomatis nama, lokasi, slug, dan link Google Review.
              </p>
            </div>

            <form onSubmit={handleCreateSingle} className="space-y-5">
              {/* Slug */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Slug Identifier (URL Kartu)
                  </label>
                  <button
                    type="button"
                    onClick={() => setSlug(generateSlug(8))}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
                  >
                    <DiceFive size={14} weight="bold" />
                    <span>Acak Slug Baru</span>
                  </button>
                </div>
                <div className="flex rounded-xl shadow-xs">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-mono">
                    /c/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="misal: cafe-budi"
                    required
                    className="flex-1 min-w-0 block w-full px-3.5 py-2.5 rounded-r-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  NFC & QR Card akan mengarah ke: <code className="text-blue-600 dark:text-blue-400 font-mono font-semibold">{appUrl}/c/{slug}</code>
                </p>
              </div>

              {/* Template Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Pilih Template Desain Kartu
                  </label>
                  <Link
                    href="/admin/templates/builder"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <PaintBrushBroad size={14} weight="bold" />
                    <span>Buka Template Studio</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availableTemplates.map((ct) => {
                    const isSelected = selectedTemplate === ct.id;
                    return (
                      <button
                        key={ct.id}
                        type="button"
                        onClick={() => setSelectedTemplate(ct.id)}
                        className={`p-3 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-500/10 ring-2 ring-blue-500/20'
                            : 'border-blue-200 dark:border-blue-800/60 hover:border-blue-300 bg-blue-50/20 dark:bg-blue-950/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-blue-950 dark:text-blue-200">
                            {ct.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-blue-600 text-white">
                            {ct.isCustom ? 'Studio Custom' : 'Preset'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {ct.isCustom ? 'Desain kustom Anda' : 'Template bawaan'} ({ct.elements.length} elemen)
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Business Name & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Nama Bisnis / Toko <span className="text-slate-400 font-normal text-xs">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Kosongkan jika tanpa nama bisnis"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Lokasi / Cabang <span className="text-slate-400 font-normal text-xs">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="misal: Jakarta Selatan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Card Options: Language & Branding Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Language Switcher */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Bahasa Kartu
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pilih teks instruksi
                    </p>
                  </div>
                  <div className="flex p-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setCardLang('en')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        cardLang === 'en'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardLang('id')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        cardLang === 'id'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      ID
                    </button>
                  </div>
                </div>

                {/* Branding Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Badge InvictusWave
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Di bawah nama bisnis
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showBranding}
                    onChange={(e) => setShowBranding(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Google Review URL */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Google Review URL <span className="text-slate-400 font-normal text-xs">(Opsional saat pembuatan awal)</span>
                </label>
                <input
                  type="url"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  placeholder="https://g.page/r/xxx/review"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tempel link dari Google Business Profile melalui <strong>Minta ulasan</strong>.
                  Jika kosong, kartu berstatus <span className="font-semibold text-amber-500">Belum Aktif</span>.
                </p>
              </div>

              {/* Security PIN */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  6-Digit PIN Keamanan <span className="text-slate-400 font-normal text-xs">(Opsional)</span>
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="6 digit angka (misal: 123456)"
                  maxLength={6}
                  pattern="\d{6}"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono"
                />
              </div>

              {/* Feedback Alert */}
              {singleMessage && (
                <div
                  className={`p-4 rounded-xl text-sm ${
                    singleMessage.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {singleMessage.text}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loadingSingle}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold rounded-xl px-5 py-3 text-sm transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loadingSingle ? (
                    'Menyimpan...'
                  ) : (
                    <>
                      <Check size={18} weight="bold" />
                      <span>Simpan & Terbitkan Kartu</span>
                    </>
                  )}
                </button>

                {createdCard && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors"
                  >
                    Buat Lagi
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Live Preview Right Column */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="sticky top-8 w-full flex flex-col items-center space-y-4">
              <div className="flex items-center justify-between w-full px-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Live Card Preview
                </span>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {availableTemplates.find((t) => t.id === selectedTemplate)?.name || 'Template'} ({cardLang.toUpperCase()})
                </span>
              </div>

              {/* Card Preview Component */}
              <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner flex items-center justify-center min-h-[380px] overflow-hidden">
                {(() => {
                  const activeTemplate = availableTemplates.find((t) => t.id === selectedTemplate);
                  if (!activeTemplate) return null;
                  
                  return (
                    <CanvasRenderer
                      template={activeTemplate}
                      scale={0.7}
                      interactive={false}
                      mockData={{
                        businessName: businessName || '',
                        location: location || '',
                        slug: slug,
                        url: `${appUrl}/c/${slug}`,
                        showBranding
                      }}
                    />
                  );
                })()}
              </div>

              {/* Quick Actions after creation */}
              {createdCard && (
                <div className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                    <CheckCircle size={16} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
                    <span>Kartu Siap Dicetak & Ditulis ke NFC</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowQrModal(true)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors shadow-xs"
                    >
                      Buka Modal Print & QR
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${appUrl}/c/${slug}`);
                        alert('NFC URL berhasil disalin!');
                      }}
                      className="px-3 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 text-xs font-medium transition-colors"
                    >
                      Salin Link NFC
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BULK GENERATOR                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'bulk' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Generate Kartu Massal (Bulk Generator)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Buat puluhan atau ratusan kartu sekaligus dengan slug unik acak untuk stok fisik kartu NFC & QR akrilik.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Count */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Jumlah Kartu (Maks. 200)
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={bulkCount}
                onChange={(e) => setBulkCount(Math.min(200, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Template */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Default Template Desain
              </label>
              <select
                value={bulkTemplate}
                onChange={(e) => setBulkTemplate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {availableTemplates.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Location Batch */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Tag Lokasi / Batch <span className="text-slate-400 font-normal text-xs">(Opsional)</span>
              </label>
              <input
                type="text"
                value={bulkLocation}
                onChange={(e) => setBulkLocation(e.target.value)}
                placeholder="misal: Batch Cetak 01"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleBulkGenerate}
              disabled={loadingBulk}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold rounded-xl px-6 py-3 text-sm transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loadingBulk ? (
                'Sedang Mengenerate...'
              ) : (
                <>
                  <Lightning size={18} weight="bold" />
                  <span>Generate {bulkCount} Kartu Sekarang</span>
                </>
              )}
            </button>
          </div>

          {bulkError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-sm">
              {bulkError}
            </div>
          )}

          {/* Bulk Result Table */}
          {bulkResult && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                  ✓ Berhasil generate {bulkResult.length} kartu baru!
                </p>
                <button
                  onClick={handleDownloadBulkCsv}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold transition-colors"
                >
                  <DownloadSimple size={16} weight="bold" />
                  <span>Download Data CSV</span>
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                      <th className="px-4 py-2.5 text-left font-semibold">No</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Slug</th>
                      <th className="px-4 py-2.5 text-left font-semibold">NFC Redirect URL</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Template</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {bulkResult.map((c, idx) => (
                      <tr key={c.slug} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-2 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {c.slug}
                        </td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          {c.url}
                        </td>
                        <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                          {c.template}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR & Print Modal (for newly generated card) */}
      {showQrModal && (
        <QRExport
          cards={[{
            id: 'temp-id',
            slug,
            businessName: businessName,
            location: location,
            template: selectedTemplate,
            status: 'active',
            totalScans: 0
          }]}
          appUrl={appUrl}
          onClose={() => setShowQrModal(false)}
        />
      )}
    </div>
  );
}

export default function CreateCardPage() {
  return (
    <Suspense fallback={null}>
      <CreateCardContent />
    </Suspense>
  );
}
