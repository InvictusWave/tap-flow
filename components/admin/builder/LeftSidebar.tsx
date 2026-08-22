'use client';

import React, { useState } from 'react';
import { CanvasElement, CustomTemplateData, NfcIconVariant } from '@/types/template-builder';
import { TEMPLATE_PRESETS } from '@/lib/template-presets';
import { nanoid } from 'nanoid';
import {
  Palette,
  TextT,
  QrCode,
  Star,
  UploadSimple,
  Shapes,
  PaintBucket,
  DeviceMobile,
  ArrowsClockwise,
  Phone,
  Broadcast,
  WifiHigh,
  Target,
  Code,
} from '@phosphor-icons/react';

interface LeftSidebarProps {
  onAddElement: (element: CanvasElement) => void;
  onApplyPreset: (preset: CustomTemplateData) => void;
  onChangeBackground: (background: string) => void;
  customTemplatesList?: CustomTemplateData[];
}

type TabType = 'presets' | 'text' | 'qr_nfc' | 'google' | 'upload' | 'shapes' | 'background';

export default function LeftSidebar({
  onAddElement,
  onApplyPreset,
  onChangeBackground,
  customTemplatesList = [],
}: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('presets');
  const [rawSvgInput, setRawSvgInput] = useState('');

  // Helper to add a new text element
  const handleAddText = (
    text: string,
    fontSize = 24,
    fontWeight = '700',
    color = '#111827'
  ) => {
    onAddElement({
      id: `text-${nanoid(6)}`,
      type: 'text',
      content: text,
      x: 100,
      y: 200,
      width: 300,
      height: fontSize * 1.5,
      zIndex: 10,
      fontSize,
      fontWeight,
      color,
      textAlign: 'center',
      fontFamily: 'Outfit',
    });
  };

  // Helper to add QR code element
  const handleAddQR = () => {
    onAddElement({
      id: `qr-${nanoid(6)}`,
      type: 'qr',
      x: 200,
      y: 200,
      width: 100,
      height: 100,
      zIndex: 10,
      borderRadius: 10,
      borderColor: '#cbd5e1',
      borderWidth: 1,
      backgroundColor: '#ffffff',
    });
  };

  // Helper to add NFC icon variant
  const handleAddNfcIcon = (
    iconVariant: NfcIconVariant,
    isDark = false,
    width = 110,
    height = 85
  ) => {
    onAddElement({
      id: `nfc-${nanoid(6)}`,
      type: 'nfc_icon',
      iconVariant,
      x: 195,
      y: 200,
      width,
      height,
      zIndex: 10,
      isDark,
      color: isDark ? '#ffffff' : '#000000',
    });
  };

  // Helper to add custom SVG code
  const handleAddCustomSvg = (svgXml: string) => {
    if (!svgXml.trim()) return;
    onAddElement({
      id: `svg-${nanoid(6)}`,
      type: 'svg',
      iconVariant: 'custom_svg',
      svgContent: svgXml.trim(),
      x: 190,
      y: 190,
      width: 120,
      height: 120,
      zIndex: 10,
    });
    setRawSvgInput('');
  };

  // Helper to add Google elements
  const handleAddGoogleLogo = () => {
    onAddElement({
      id: `google-${nanoid(6)}`,
      type: 'google_logo',
      content: 'g_icon',
      x: 215,
      y: 100,
      width: 70,
      height: 70,
      zIndex: 10,
    });
  };

  const handleAddStars = (filled = true, color = '#FBBC05') => {
    onAddElement({
      id: `stars-${nanoid(6)}`,
      type: 'stars',
      x: 170,
      y: 160,
      width: 160,
      height: 28,
      zIndex: 10,
      starCount: 5,
      starFilled: filled,
      starColor: color,
    });
  };

  // Helper to add Shapes
  const handleAddShape = (
    backgroundColor = '#ffffff',
    borderRadius = 24,
    boxShadow = '0 10px 25px rgba(0,0,0,0.1)'
  ) => {
    onAddElement({
      id: `shape-${nanoid(6)}`,
      type: 'shape',
      x: 50,
      y: 120,
      width: 400,
      height: 320,
      zIndex: 1,
      backgroundColor,
      borderRadius,
      boxShadow,
    });
  };

  const handleAddDividerOr = (content: string = 'OR') => {
    onAddElement({
      id: `divider-${nanoid(6)}`,
      type: 'divider_or',
      content: content,
      x: 235,
      y: 300,
      width: 30,
      height: 90,
      zIndex: 10,
      color: '#111827',
    });
  };

  // Helper for image / svg upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => {
        const svgContent = reader.result as string;
        handleAddCustomSvg(svgContent);
      };
      reader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      onAddElement({
        id: `img-${nanoid(6)}`,
        type: 'image',
        content: dataUri,
        x: 150,
        y: 150,
        width: 160,
        height: 160,
        zIndex: 10,
        borderRadius: 8,
      });
    };
    reader.readAsDataURL(file);
  };

  const navItems = [
    { id: 'presets', label: 'Template', icon: <Palette size={22} weight="duotone" /> },
    { id: 'text', label: 'Teks', icon: <TextT size={22} weight="duotone" /> },
    { id: 'qr_nfc', label: 'QR & NFC', icon: <QrCode size={22} weight="duotone" /> },
    { id: 'google', label: 'Google', icon: <Star size={22} weight="duotone" /> },
    { id: 'upload', label: 'Unggah', icon: <UploadSimple size={22} weight="duotone" /> },
    { id: 'shapes', label: 'Bentuk', icon: <Shapes size={22} weight="duotone" /> },
    { id: 'background', label: 'Latar', icon: <PaintBucket size={22} weight="duotone" /> },
  ];

  return (
    <div className="flex h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
      {/* Icon Navigation Bar (Left Strip) */}
      <div className="w-16 sm:w-20 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-3 space-y-2 bg-slate-50 dark:bg-slate-950 shrink-0">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as TabType)}
            className={`w-14 sm:w-16 py-2.5 rounded-xl flex flex-col items-center justify-center transition-all ${
              activeTab === item.id
                ? 'bg-blue-600 text-white shadow-md font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div>{item.icon}</div>
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Panel Content */}
      <div className="w-72 sm:w-80 p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
        {/* ========================================================================= */}
        {/* TAB 1: TEMPLATES & PRESETS                                                */}
        {/* ========================================================================= */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm">Pilih Template Awal</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mulai dari preset desain atau rancang template kustom dari nol
              </p>
            </div>

            <div className="space-y-2.5">
              {customTemplatesList.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => onApplyPreset(ct)}
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-white dark:bg-slate-800/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {ct.name}
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {ct.aspect}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {ct.elements.length} elemen desain
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: TEXT ELEMENTS                                                      */}
        {/* ========================================================================= */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm">Tambahkan Teks</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Klik untuk menambahkan teks statis atau variabel dinamis
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleAddText('Judul Utama', 40, '700', '#000000')}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-left font-bold text-base bg-white dark:bg-slate-800 transition-colors"
              >
                Tambahkan Judul Besar
              </button>

              <button
                onClick={() => handleAddText('Subjudul / Instruksi', 22, '600', '#111827')}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-left font-semibold text-sm bg-white dark:bg-slate-800 transition-colors"
              >
                Tambahkan Subjudul
              </button>

              <button
                onClick={() => handleAddText('Teks deskripsi / catatan kecil', 14, '400', '#4b5563')}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-left text-xs bg-white dark:bg-slate-800 transition-colors"
              >
                Tambahkan Teks Paragraf
              </button>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Variabel Otomatis (Dynamic Tokens)
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Auto-Sync</span>
              </div>

              <button
                onClick={() => handleAddText('{{businessName}}', 20, '700', '#111827')}
                className="w-full p-2.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/60 text-left text-xs font-mono text-blue-800 dark:text-blue-300 transition-colors flex items-center justify-between"
              >
                <span>+ <strong className="font-sans font-bold">Nama Bisnis:</strong> {'{{businessName}}'}</span>
              </button>

              <button
                onClick={() => handleAddText('{{location}}', 14, '500', '#6b7280')}
                className="w-full p-2.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/60 text-left text-xs font-mono text-blue-800 dark:text-blue-300 transition-colors flex items-center justify-between"
              >
                <span>+ <strong className="font-sans font-bold">Lokasi / Cabang:</strong> {'{{location}}'}</span>
              </button>

              <button
                onClick={() => handleAddText('{{slug}}', 12, '700', '#9ca3af')}
                className="w-full p-2.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/60 text-left text-xs font-mono text-blue-800 dark:text-blue-300 transition-colors flex items-center justify-between"
              >
                <span>+ <strong className="font-sans font-bold">Kode Serial Kartu:</strong> {'{{slug}}'}</span>
              </button>

              {/* Badge & Branding InvictusWave Tokens */}
              <button
                onClick={() => handleAddText('{{branding}}', 11, '600', '#6b7280')}
                className="w-full p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/60 text-left text-xs font-mono text-indigo-800 dark:text-indigo-300 transition-colors flex items-center justify-between"
              >
                <span>+ <strong className="font-sans font-bold">Badge Invictus:</strong> {'{{branding}}'}</span>
              </button>

              <button
                onClick={() => handleAddText('{{poweredBy}}', 10, '500', '#9ca3af')}
                className="w-full p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/60 text-left text-xs font-mono text-indigo-800 dark:text-indigo-300 transition-colors flex items-center justify-between"
              >
                <span>+ <strong className="font-sans font-bold">Powered by:</strong> {'{{poweredBy}}'}</span>
              </button>

              <button
                onClick={() => handleAddText('{{tagline}}', 12, '700', '#2563eb')}
                className="w-full p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/60 text-left text-xs font-mono text-indigo-800 dark:text-indigo-300 transition-colors flex items-center justify-between"
              >
                <span>+ <strong className="font-sans font-bold">Tagline Brand:</strong> {'{{tagline}}'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: QR CODE, NFC ICONS & CUSTOM SVG                                     */}
        {/* ========================================================================= */}
        {activeTab === 'qr_nfc' && (
          <div className="space-y-5">
            <div>
              <h3 className="font-bold text-sm">QR Code & Elemen NFC</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Koleksi ikon NFC dan QR code pintar untuk kartu & stand
              </p>
            </div>

            {/* Dynamic QR */}
            <button
              onClick={handleAddQR}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 flex items-center gap-3 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <QrCode size={22} weight="duotone" />
              </div>
              <div className="text-left">
                <p className="font-bold text-xs">Dynamic QR Code</p>
                <p className="text-[11px] text-slate-500">Auto-generate URL /c/[slug]</p>
              </div>
            </button>

            {/* Complete NFC Variants Library */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Koleksi Vektor Ikon NFC
              </span>

              <div className="space-y-2">
                <button
                  onClick={() => handleAddNfcIcon('hand_phone', false, 110, 80)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 flex items-center gap-3 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <DeviceMobile size={20} weight="duotone" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xs">Hand & Phone Waves</p>
                    <p className="text-[10px] text-slate-500">Standar Google review</p>
                  </div>
                </button>

                <button
                  onClick={() => handleAddNfcIcon('circular_tap', false, 100, 80)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 flex items-center gap-3 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <ArrowsClockwise size={20} weight="duotone" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xs">Circular Tap Arrows</p>
                    <p className="text-[10px] text-slate-500">TagThose eTTa Style</p>
                  </div>
                </button>

                <button
                  onClick={() => handleAddNfcIcon('phone_outline', true, 80, 110)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-slate-900 text-white flex items-center gap-3 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-200 shrink-0">
                    <Phone size={20} weight="duotone" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xs">Phone Outline (Dark)</p>
                    <p className="text-[10px] text-slate-400">Akrilik hitam glossy</p>
                  </div>
                </button>

                <button
                  onClick={() => handleAddNfcIcon('nfc_badge', false, 60, 50)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 flex items-center gap-3 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Broadcast size={20} weight="duotone" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xs">Corner NFC Wave Badge</p>
                    <p className="text-[10px] text-slate-500">Ikon sudut kartu PVC</p>
                  </div>
                </button>

                <button
                  onClick={() => handleAddNfcIcon('waves_only', false, 70, 70)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 flex items-center gap-3 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <WifiHigh size={20} weight="duotone" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xs">Pure Signal Radar Waves</p>
                    <p className="text-[10px] text-slate-500">Apple / EMV minimalis</p>
                  </div>
                </button>

                <button
                  onClick={() => handleAddNfcIcon('tap_target_circle', false, 90, 90)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 flex items-center gap-3 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                    <Target size={20} weight="duotone" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xs">TAP HERE Circle Target</p>
                    <p className="text-[10px] text-slate-500">Target tempel lingkaran</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom SVG Input & Embed */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Code size={14} weight="bold" />
                <span>Simpan Elemen SVG Kustom</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Tempel kode XML `<svg>...</svg>` untuk dimasukkan sebagai elemen vektor di kanvas:
              </p>
              <textarea
                rows={3}
                value={rawSvgInput}
                onChange={(e) => setRawSvgInput(e.target.value)}
                placeholder="<svg viewBox='0 0 24 24'>...</svg>"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleAddCustomSvg(rawSvgInput)}
                disabled={!rawSvgInput.trim()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                + Masukkan SVG ke Kanvas
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: GOOGLE ELEMENTS                                                    */}
        {/* ========================================================================= */}
        {activeTab === 'google' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm">Aset Google Official</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Logo resmi Google dan indikator bintang rating
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleAddGoogleLogo}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 flex items-center gap-3 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center p-1.5 shrink-0">
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div className="text-left min-w-0">
                  <p className="font-bold text-xs">Official Google "G" Logo</p>
                  <p className="text-[11px] text-slate-500">4-Color Vector Badge</p>
                </div>
              </button>

              {/* 1 Star Preview for 5 Golden Stars */}
              <button
                onClick={() => handleAddStars(true, '#FBBC05')}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 flex items-center gap-3 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 shrink-0">
                  <Star size={24} weight="fill" />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-bold text-xs">5 Bintang Google (Emas)</p>
                  <p className="text-[11px] text-slate-500">Rating 5 Bintang Emas Penuh</p>
                </div>
              </button>

              {/* 1 Star Preview for 5 Outline Stars */}
              <button
                onClick={() => handleAddStars(false, '#111827')}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 flex items-center gap-3 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 shrink-0">
                  <Star size={24} weight="bold" />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-bold text-xs">5 Bintang Google (Garis)</p>
                  <p className="text-[11px] text-slate-500">Rating 5 Bintang Minimalis</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: UPLOAD IMAGES / ASSETS / SVG                                       */}
        {/* ========================================================================= */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm">Unggah Logo / Gambar / SVG</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tambahkan logo bisnis kustom atau file vektor SVG Anda
              </p>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50/40 transition-colors p-4 text-center">
              <UploadSimple size={32} weight="duotone" className="text-slate-400 mb-1" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilih File Logo / Gambar / SVG
              </span>
              <span className="text-[10px] text-slate-400 mt-1">SVG, PNG, JPG, WebP</span>
              <input
                type="file"
                accept="image/*,.svg"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: SHAPES & LAYOUT CONTAINERS                                         */}
        {/* ========================================================================= */}
        {activeTab === 'shapes' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm">Bentuk & Kontainer</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Plakat putih, kartu melingkar, dan garis pemisah
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => handleAddShape('#ffffff', 28, '0 10px 25px rgba(0,0,0,0.1)')}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 text-left transition-colors"
              >
                <p className="font-bold text-xs">White Center Plaque (Rounded)</p>
                <p className="text-[11px] text-slate-500">Plakat putih tengah untuk kartu 4 warna</p>
              </button>

              <button
                onClick={() => handleAddShape('#ffffff', 65, '0 4px 12px rgba(0,0,0,0.08)')}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 text-left transition-colors"
              >
                <p className="font-bold text-xs">Circular Badge Disk</p>
                <p className="text-[11px] text-slate-500">Lingkaran putih untuk dudukan logo G</p>
              </button>

              <button
                onClick={() => handleAddDividerOr('OR')}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 text-left transition-colors"
              >
                <p className="font-bold text-xs">Vertical Divider with "OR"</p>
                <p className="text-[11px] text-slate-500">Garis pemisah vertikal TAP | OR | SCAN</p>
              </button>

              <button
                onClick={() => handleAddDividerOr('ATAU')}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 text-left transition-colors"
              >
                <p className="font-bold text-xs">Vertical Divider with "ATAU"</p>
                <p className="text-[11px] text-slate-500">Garis pemisah vertikal TAP | ATAU | SCAN</p>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: BACKGROUNDS                                                        */}
        {/* ========================================================================= */}
        {activeTab === 'background' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm">Latar Belakang Kartu</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pilih gradasi warna atau warna solid untuk latar kartu
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() =>
                  onChangeBackground(
                    'conic-gradient(from 12deg at 50% 50%, #EA4335 0deg 90deg, #FBBC05 90deg 180deg, #34A853 180deg 270deg, #4285F4 270deg 360deg)'
                  )
                }
                className="h-20 rounded-2xl p-2 text-left relative overflow-hidden shadow-xs border border-white/20 flex flex-col justify-end"
                style={{
                  background:
                    'conic-gradient(from 12deg at 50% 50%, #EA4335 0deg 90deg, #FBBC05 90deg 180deg, #34A853 180deg 270deg, #4285F4 270deg 360deg)',
                }}
              >
                <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Google 4-Color
                </span>
              </button>

              <button
                onClick={() => onChangeBackground('#090b10')}
                className="h-20 rounded-2xl p-2 text-left relative overflow-hidden shadow-xs border border-slate-700 bg-[#090b10] flex flex-col justify-end"
              >
                <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Glossy Black
                </span>
              </button>

              <button
                onClick={() => onChangeBackground('#fcfcfc')}
                className="h-20 rounded-2xl p-2 text-left relative overflow-hidden shadow-xs border border-slate-300 bg-[#fcfcfc] flex flex-col justify-end"
              >
                <span className="bg-slate-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Pure White
                </span>
              </button>

              <button
                onClick={() =>
                  onChangeBackground(
                    'linear-gradient(135deg, #080d1a 0%, #101b33 50%, #080d1a 100%)'
                  )
                }
                className="h-20 rounded-2xl p-2 text-left relative overflow-hidden shadow-xs border border-amber-500/30 flex flex-col justify-end"
                style={{
                  background: 'linear-gradient(135deg, #080d1a 0%, #101b33 50%, #080d1a 100%)',
                }}
              >
                <span className="bg-amber-500/30 text-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Royal Navy
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
