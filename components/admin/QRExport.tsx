'use client';

import React, { useState, useRef, useEffect } from 'react';
import CanvasRenderer from './builder/CanvasRenderer';
import { Printer, X, Copy } from '@phosphor-icons/react';
import { DEFAULT_TEMPLATE_ID, TEMPLATE_PRESETS } from '@/lib/template-presets';
import { CustomTemplateData } from '@/types/template-builder';

interface CardData {
  id: string;
  slug: string;
  businessName: string | null;
  location?: string | null;
  template?: string | null;
  status: string;
  totalScans: number;
}

interface Props {
  cards: CardData[];
  appUrl: string;
  onClose: () => void;
}

type TemplateOption = {
  id: string;
  name: string;
  aspect: 'square' | 'vertical' | 'horizontal';
  width: number;
  height: number;
  background: string;
  elements: CustomTemplateData['elements'];
  isCustom?: boolean;
};

export default function QRExport({ cards, appUrl, onClose }: Props) {
  const card = cards[0]; // For preview and single export
  const [selectedTemplate, setSelectedTemplate] = useState(card?.template || DEFAULT_TEMPLATE_ID);
  const [showBranding, setShowBranding] = useState(false);
  const [cardLang, setCardLang] = useState<'en' | 'id'>('en');
  const redirectUrl = `${appUrl}/c/${card.slug}`;
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [customTemplatesList, setCustomTemplatesList] = useState<TemplateOption[]>([]);
  const availableTemplates = [...TEMPLATE_PRESETS, ...customTemplatesList];

  useEffect(() => {
    fetch('/api/admin/templates')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setCustomTemplatesList(data?.templates || []))
      .catch(console.error);
  }, []);

  const currentTemplate = availableTemplates.find((t) => t.id === selectedTemplate);
  const aspect = currentTemplate?.aspect || 'square';
  const isVertical = aspect === 'vertical';

  const [isExporting, setIsExporting] = useState(false);

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      const { toPng } = await import('html-to-image');
      
      if (cards.length === 1) {
        // Single export
        const el = document.getElementById(`export-card-${cards[0].id}`);
        if (!el) throw new Error('Element not found');
        
        const dataUrl = await toPng(el, { backgroundColor: 'transparent', pixelRatio: 4 });
        const link = document.createElement('a');
        link.download = `tapflow-${cards[0].slug}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        // Bulk export (ZIP)
        const JSZip = (await import('jszip')).default;
        const { saveAs } = await import('file-saver');
        const zip = new JSZip();
        
        for (const c of cards) {
          const el = document.getElementById(`export-card-${c.id}`);
          if (!el) continue;
          
          const dataUrl = await toPng(el, { backgroundColor: 'transparent', pixelRatio: 4 });
          const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
          zip.file(`tapflow-${c.slug}.png`, base64Data, { base64: true });
        }
        
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `tapflow-export-${cards.length}-cards.zip`);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor gambar. Pastikan gambar / font sudah termuat dengan sempurna.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex overflow-y-auto bg-black/70 p-4 backdrop-blur-xs">
      <div className="relative m-auto flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800 sm:px-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Cetak & Desain Kartu TapFlow
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih template desain akrilik 10x10 cm atau kartu PVC vertikal (54x86mm)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 sm:px-8 sm:pb-8">
        {/* Controls: Template, Language, & Branding */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Pilih Desain & Ukuran
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableTemplates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`p-2.5 rounded-xl text-left transition-all border ${
                    selectedTemplate === tmpl.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs truncate">{tmpl.name}</p>
                  <span className="mt-0.5 block text-[10px] font-mono text-slate-400">
                    {tmpl.aspect} {'isCustom' in tmpl && tmpl.isCustom ? '· Custom' : '· Preset'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Language Switcher */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Bahasa Kartu
              </span>
              <div className="flex p-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCardLang('en')}
                  className={`px-2 py-0.5 rounded transition-all ${
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
                  className={`px-2 py-0.5 rounded transition-all ${
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
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Badge &quot;InvictusWave&quot;
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

        {/* Card Display & Printable Area */}
        <div className="my-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner min-h-[360px] overflow-hidden">
          <div ref={printAreaRef}>
            {(() => {
              const activeTemplate = availableTemplates.find((t) => t.id === selectedTemplate);
              if (!activeTemplate) return null;
              
              return (
                <CanvasRenderer
                  template={activeTemplate}
                  scale={aspect === 'vertical' ? 0.72 : 0.9}
                  interactive={false}
                  mockData={{
                    businessName: card.businessName || '',
                    location: card.location || '',
                    slug: card.slug,
                    url: redirectUrl,
                    showBranding
                  }}
                />
              );
            })()}
          </div>
        </div>

        {/* NFC Programming Info Box */}
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl p-4 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900 dark:text-blue-200">URL NFC (NTAG213):</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(redirectUrl);
                alert('URL disalin ke clipboard!');
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
            >
              <Copy size={13} weight="bold" />
              <span>Salin</span>
            </button>
          </div>
          <code className="block font-mono text-[11px] text-blue-700 dark:text-blue-300 break-all">
            {redirectUrl}
          </code>
        </div>

        {/* Bulk Hidden Render Container (for PNG Export) */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none' }} id="bulk-export-container">
          {cards.map((c) => {
            const activeTemplate = availableTemplates.find((t) => t.id === selectedTemplate);
            if (!activeTemplate) return null;
            return (
              <div key={c.id} id={`export-card-${c.id}`} className="bg-transparent mb-4 overflow-hidden" style={{ width: isVertical ? 421 : 500, height: isVertical ? 670 : 500 }}>
                <CanvasRenderer
                  template={activeTemplate}
                  scale={1}
                  interactive={false}
                  mockData={{
                    businessName: c.businessName || '',
                    location: c.location || '',
                    slug: c.slug,
                    url: `${appUrl}/c/${c.slug}`,
                    showBranding
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Printer size={18} weight="bold" />
            <span>
              {isExporting ? 'Memproses Export...' : (cards.length > 1 ? `Export ${cards.length} PNG (ZIP)` : 'Export PNG')}
            </span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
