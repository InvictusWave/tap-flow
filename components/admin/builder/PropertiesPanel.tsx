'use client';

import React from 'react';
import { CanvasElement, NfcIconVariant } from '@/types/template-builder';
import {
  Copy,
  Trash,
  ArrowUp,
  ArrowDown,
  HandPointing,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignLeft,
  AlignRight,
  AlignTop,
  AlignBottom,
  SquaresFour,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  DeviceMobile,
  ArrowsClockwise,
  Phone,
  Broadcast,
  WifiHigh,
  Target,
  Code,
  Plus,
  Minus,
  TextT,
  Palette,
} from '@phosphor-icons/react';

interface PropertiesPanelProps {
  element: CanvasElement | null;
  selectedIds?: string[];
  allElements?: CanvasElement[];
  canvasWidth?: number;
  canvasHeight?: number;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onUpdateMultipleElements?: (updates: { id: string; updates: Partial<CanvasElement> }[]) => void;
  onDeleteElement: (id: string) => void;
  onDeleteMultipleElements?: (ids: string[]) => void;
  onDuplicateElement: (id: string) => void;
  onDuplicateMultipleElements?: (ids: string[]) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
}

const FONT_FAMILIES = [
  { label: 'Outfit (Google Sans-like)', value: 'Outfit, sans-serif' },
  { label: 'Inter (Clean Sans)', value: 'Inter, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Playfair Display (Serif)', value: 'Playfair Display, serif' },
  { label: 'Monospace Code', value: 'monospace' },
];

const COLOR_SWATCHES = [
  '#000000',
  '#111827',
  '#4b5563',
  '#ffffff',
  '#4285F4',
  '#EA4335',
  '#FBBC05',
  '#34A853',
  '#2563eb',
  '#4f46e5',
  '#d97706',
  '#059669',
];

const NFC_LIBRARY: { id: NfcIconVariant; label: string; icon: React.ReactNode }[] = [
  {
    id: 'hand_phone',
    label: 'Hand & Radar Waves',
    icon: <DeviceMobile size={18} weight="duotone" className="text-blue-500" />,
  },
  {
    id: 'circular_tap',
    label: 'Circular Arrows (eTTa)',
    icon: <ArrowsClockwise size={18} weight="duotone" className="text-emerald-500" />,
  },
  {
    id: 'phone_outline',
    label: 'Phone Outline Radar',
    icon: <Phone size={18} weight="duotone" className="text-purple-500" />,
  },
  {
    id: 'nfc_badge',
    label: 'Corner Wave Badge',
    icon: <Broadcast size={18} weight="duotone" className="text-indigo-500" />,
  },
  {
    id: 'waves_only',
    label: 'Pure Signal Waves',
    icon: <WifiHigh size={18} weight="duotone" className="text-amber-500" />,
  },
  {
    id: 'tap_target_circle',
    label: 'TAP HERE Circle Target',
    icon: <Target size={18} weight="duotone" className="text-rose-500" />,
  },
];

export default function PropertiesPanel({
  element,
  selectedIds = [],
  allElements = [],
  canvasWidth = 500,
  canvasHeight = 500,
  onUpdateElement,
  onUpdateMultipleElements,
  onDeleteElement,
  onDeleteMultipleElements,
  onDuplicateElement,
  onDuplicateMultipleElements,
  onBringForward,
  onSendBackward,
}: PropertiesPanelProps) {
  const isMultiSelect = selectedIds.length > 1;
  const selectedElements = allElements.filter((el) => selectedIds.includes(el.id));
  const textElements = selectedElements.filter((el) => el.type === 'text');
  const shapeElements = selectedElements.filter((el) => el.type === 'shape');
  const iconElements = selectedElements.filter((el) => el.type === 'nfc_icon' || el.type === 'svg');
  const starElements = selectedElements.filter((el) => el.type === 'stars');

  // Multi-element alignment helpers
  const handleAlign = (alignment: 'left' | 'center_h' | 'right' | 'top' | 'middle_v' | 'bottom' | 'center_canvas_h' | 'center_canvas_v') => {
    if (selectedElements.length === 0) return;

    if (alignment === 'center_canvas_h') {
      if (onUpdateMultipleElements) {
        onUpdateMultipleElements(
          selectedElements.map((el) => ({
            id: el.id,
            updates: { x: Math.round((canvasWidth - el.width) / 2) },
          }))
        );
      } else {
        selectedElements.forEach((el) => {
          onUpdateElement(el.id, { x: Math.round((canvasWidth - el.width) / 2) });
        });
      }
      return;
    }

    if (alignment === 'center_canvas_v') {
      if (onUpdateMultipleElements) {
        onUpdateMultipleElements(
          selectedElements.map((el) => ({
            id: el.id,
            updates: { y: Math.round((canvasHeight - el.height) / 2) },
          }))
        );
      } else {
        selectedElements.forEach((el) => {
          onUpdateElement(el.id, { y: Math.round((canvasHeight - el.height) / 2) });
        });
      }
      return;
    }

    if (selectedElements.length === 1) {
      const el = selectedElements[0];
      if (alignment === 'left') onUpdateElement(el.id, { x: 20 });
      if (alignment === 'right') onUpdateElement(el.id, { x: canvasWidth - 20 - el.width });
      if (alignment === 'top') onUpdateElement(el.id, { y: 20 });
      if (alignment === 'bottom') onUpdateElement(el.id, { y: canvasHeight - 20 - el.height });
      return;
    }

    // Multi-element relative alignments
    if (alignment === 'left') {
      const minX = Math.min(...selectedElements.map((el) => el.x));
      onUpdateMultipleElements?.(
        selectedElements.map((el) => ({ id: el.id, updates: { x: minX } }))
      );
    } else if (alignment === 'right') {
      const maxRight = Math.max(...selectedElements.map((el) => el.x + el.width));
      onUpdateMultipleElements?.(
        selectedElements.map((el) => ({ id: el.id, updates: { x: maxRight - el.width } }))
      );
    } else if (alignment === 'center_h') {
      const minX = Math.min(...selectedElements.map((el) => el.x));
      const maxRight = Math.max(...selectedElements.map((el) => el.x + el.width));
      const groupCenterX = (minX + maxRight) / 2;
      onUpdateMultipleElements?.(
        selectedElements.map((el) => ({
          id: el.id,
          updates: { x: Math.round(groupCenterX - el.width / 2) },
        }))
      );
    } else if (alignment === 'top') {
      const minY = Math.min(...selectedElements.map((el) => el.y));
      onUpdateMultipleElements?.(
        selectedElements.map((el) => ({ id: el.id, updates: { y: minY } }))
      );
    } else if (alignment === 'bottom') {
      const maxBottom = Math.max(...selectedElements.map((el) => el.y + el.height));
      onUpdateMultipleElements?.(
        selectedElements.map((el) => ({ id: el.id, updates: { y: maxBottom - el.height } }))
      );
    } else if (alignment === 'middle_v') {
      const minY = Math.min(...selectedElements.map((el) => el.y));
      const maxBottom = Math.max(...selectedElements.map((el) => el.y + el.height));
      const groupCenterY = (minY + maxBottom) / 2;
      onUpdateMultipleElements?.(
        selectedElements.map((el) => ({
          id: el.id,
          updates: { y: Math.round(groupCenterY - el.height / 2) },
        }))
      );
    }
  };

  // Batch update helpers for text elements
  const handleBatchUpdateText = (updates: Partial<CanvasElement>) => {
    if (textElements.length === 0) return;
    if (onUpdateMultipleElements) {
      onUpdateMultipleElements(textElements.map((el) => ({ id: el.id, updates })));
    } else {
      textElements.forEach((el) => onUpdateElement(el.id, updates));
    }
  };

  // Batch update helpers for all selected elements
  const handleBatchUpdateAll = (updates: Partial<CanvasElement>) => {
    if (selectedElements.length === 0) return;
    if (onUpdateMultipleElements) {
      onUpdateMultipleElements(selectedElements.map((el) => ({ id: el.id, updates })));
    } else {
      selectedElements.forEach((el) => onUpdateElement(el.id, updates));
    }
  };

  // Preset size helper
  const handleSetPresetSize = (targetSize: number) => {
    if (!element) return;
    const ratio = element.width > 0 ? element.height / element.width : 1;
    onUpdateElement(element.id, {
      width: targetSize,
      height: Math.round(targetSize * ratio),
    });
  };

  // 1. EMPTY STATE
  if (!element && !isMultiSelect) {
    return (
      <div className="w-72 sm:w-80 h-full p-5 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center text-center">
        <HandPointing size={36} weight="duotone" className="text-blue-500 mb-2" />
        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
          Pilih Elemen di Kanvas
        </p>
        <p className="text-xs mt-1">
          Klik elemen (atau tahan <strong>Shift</strong> / tarik kotak biru) untuk memilih banyak elemen sekaligus.
        </p>
      </div>
    );
  }

  // 2. MULTI-SELECTION STATE (WITH COMPREHENSIVE BATCH EDITING)
  if (isMultiSelect) {
    const firstText = textElements[0];

    return (
      <div className="w-72 sm:w-80 h-full p-5 overflow-y-auto bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Multi-Select Aktif
            </span>
            <h4 className="font-bold text-sm flex items-center gap-1.5 mt-0.5">
              <SquaresFour size={16} weight="duotone" className="text-blue-500" />
              <span>{selectedElements.length} Elemen Terpilih</span>
            </h4>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onDuplicateMultipleElements?.(selectedIds)}
              title="Duplikat Semua yang Terpilih"
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            >
              <Copy size={16} weight="bold" />
            </button>
            <button
              onClick={() => onDeleteMultipleElements?.(selectedIds)}
              title="Hapus Semua yang Terpilih"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BATCH TEXT FORMATTING (IF ANY TEXT ELEMENTS ARE SELECTED)       */}
        {/* ============================================================== */}
        {textElements.length > 0 && (
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <TextT size={15} weight="bold" className="text-blue-600" />
                <span>Format Teks ({textElements.length} Teks)</span>
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Ubah Sekaligus</span>
            </div>

            {/* Batch Font Color */}
            <div>
              <label className="text-xs font-semibold block mb-1.5 text-slate-700 dark:text-slate-300">
                Warna Teks
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="color"
                  value={firstText?.color || '#000000'}
                  onChange={(e) => handleBatchUpdateText({ color: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={firstText?.color || '#000000'}
                  onChange={(e) => handleBatchUpdateText({ color: e.target.value })}
                  className="w-24 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleBatchUpdateText({ color: c })}
                    style={{ backgroundColor: c }}
                    className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-700 shadow-2xs hover:scale-110 transition-transform"
                  />
                ))}
              </div>
            </div>

            {/* Batch Font Family */}
            <div>
              <label className="text-xs font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                Font Family
              </label>
              <select
                value={firstText?.fontFamily || 'Outfit, sans-serif'}
                onChange={(e) => handleBatchUpdateText({ fontFamily: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch Font Size & Weight */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Ukuran Font
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={8}
                    max={96}
                    value={firstText?.fontSize || 16}
                    onChange={(e) => handleBatchUpdateText({ fontSize: parseInt(e.target.value) || 16 })}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleBatchUpdateText({ fontSize: Math.max(8, (firstText?.fontSize || 16) - 2) })}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100"
                  >
                    <Minus size={12} weight="bold" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchUpdateText({ fontSize: Math.min(96, (firstText?.fontSize || 16) + 2) })}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100"
                  >
                    <Plus size={12} weight="bold" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Ketebalan
                </label>
                <select
                  value={firstText?.fontWeight || '600'}
                  onChange={(e) => handleBatchUpdateText({ fontWeight: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="400">Regular (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">SemiBold (600)</option>
                  <option value="700">Bold (700)</option>
                  <option value="800">ExtraBold (800)</option>
                </select>
              </div>
            </div>

            {/* Batch Text Alignment */}
            <div>
              <label className="text-xs font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                Perataan Teks
              </label>
              <div className="grid grid-cols-3 gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleBatchUpdateText({ textAlign: 'left' })}
                  className="py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
                  title="Rata Kiri"
                >
                  <TextAlignLeft size={16} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchUpdateText({ textAlign: 'center' })}
                  className="py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
                  title="Rata Tengah"
                >
                  <TextAlignCenter size={16} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchUpdateText({ textAlign: 'right' })}
                  className="py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
                  title="Rata Kanan"
                >
                  <TextAlignRight size={16} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* BATCH SHAPE & ICON COLOR (IF SHAPES/ICONS SELECTED)            */}
        {/* ============================================================== */}
        {(shapeElements.length > 0 || iconElements.length > 0 || starElements.length > 0) && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Palette size={15} weight="bold" className="text-emerald-500" />
              <span>Warna Bentuk & Ikon Bersama</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    const batchUpdates: { id: string; updates: Partial<CanvasElement> }[] = [];
                    shapeElements.forEach((el) => batchUpdates.push({ id: el.id, updates: { backgroundColor: c } }));
                    iconElements.forEach((el) => batchUpdates.push({ id: el.id, updates: { color: c } }));
                    starElements.forEach((el) => batchUpdates.push({ id: el.id, updates: { starColor: c, color: c } }));
                    if (onUpdateMultipleElements) onUpdateMultipleElements(batchUpdates);
                  }}
                  style={{ backgroundColor: c }}
                  className="w-6 h-6 rounded-lg border border-slate-300 dark:border-slate-600 shadow-2xs hover:scale-110 transition-transform"
                />
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ALIGNMENT GRID (CANVA STYLE)                                   */}
        {/* ============================================================== */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Ratakan Posisi (Alignment)
          </span>

          <div className="grid grid-cols-3 gap-1.5 text-xs font-medium">
            <button
              onClick={() => handleAlign('left')}
              title="Rata Kiri"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <AlignLeft size={16} weight="bold" />
              <span className="text-[10px]">Rata Kiri</span>
            </button>
            <button
              onClick={() => handleAlign('center_h')}
              title="Rata Tengah Horizontal"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <AlignCenterHorizontal size={16} weight="bold" />
              <span className="text-[10px]">Tengah H</span>
            </button>
            <button
              onClick={() => handleAlign('right')}
              title="Rata Kanan"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <AlignRight size={16} weight="bold" />
              <span className="text-[10px]">Rata Kanan</span>
            </button>
            <button
              onClick={() => handleAlign('top')}
              title="Rata Atas"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <AlignTop size={16} weight="bold" />
              <span className="text-[10px]">Rata Atas</span>
            </button>
            <button
              onClick={() => handleAlign('middle_v')}
              title="Rata Tengah Vertikal"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <AlignCenterVertical size={16} weight="bold" />
              <span className="text-[10px]">Tengah V</span>
            </button>
            <button
              onClick={() => handleAlign('bottom')}
              title="Rata Bawah"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <AlignBottom size={16} weight="bold" />
              <span className="text-[10px]">Rata Bawah</span>
            </button>
          </div>
        </div>

        {/* Center on Canvas */}
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Pusatkan ke Kanvas
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleAlign('center_canvas_h')}
              className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <AlignCenterHorizontal size={16} weight="bold" />
              <span>Tengah Kanvas H</span>
            </button>
            <button
              onClick={() => handleAlign('center_canvas_v')}
              className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <AlignCenterVertical size={16} weight="bold" />
              <span>Tengah Kanvas V</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. SINGLE ELEMENT PROPERTY INSPECTOR
  if (!element) return null;

  return (
    <div className="w-72 sm:w-80 h-full p-5 overflow-y-auto bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white space-y-6">
      {/* Header with Type & Actions */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Inspector Elemen
          </span>
          <h4 className="font-bold text-sm capitalize">
            {element.type === 'nfc_icon' ? 'Ikon NFC / Vektor' : element.type === 'svg' ? 'Custom SVG' : element.type.replace('_', ' ')}
          </h4>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicateElement(element.id)}
            title="Duplikat Elemen"
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
          >
            <Copy size={16} weight="bold" />
          </button>
          <button
            onClick={() => onDeleteElement(element.id)}
            title="Hapus Elemen"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* Alignment Tools (Single element) */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Perataan Posisi
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => handleAlign('center_canvas_h')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <AlignCenterHorizontal size={14} weight="bold" />
            <span>Tengah Horisontal</span>
          </button>
          <button
            onClick={() => handleAlign('center_canvas_v')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <AlignCenterVertical size={14} weight="bold" />
            <span>Tengah Vertikal</span>
          </button>
        </div>
      </div>

      {/* Size & Position Box */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Ukuran & Koordinat
        </span>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Posisi X (px)</label>
            <input
              type="number"
              value={element.x}
              onChange={(e) => onUpdateElement(element.id, { x: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Posisi Y (px)</label>
            <input
              type="number"
              value={element.y}
              onChange={(e) => onUpdateElement(element.id, { y: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Lebar W (px)</label>
            <input
              type="number"
              min={10}
              value={element.width}
              onChange={(e) => onUpdateElement(element.id, { width: parseInt(e.target.value) || 10 })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Tinggi H (px)</label>
            <input
              type="number"
              min={10}
              value={element.height}
              onChange={(e) => onUpdateElement(element.id, { height: parseInt(e.target.value) || 10 })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Quick Size Presets for NFC / Icons / Logos */}
        {(element.type === 'nfc_icon' || element.type === 'google_logo' || element.type === 'qr' || element.type === 'svg') && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-400">Preset Ukuran Cepat:</span>
            <div className="flex gap-1.5">
              {[50, 75, 100, 140].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleSetPresetSize(sz)}
                  className={`flex-1 py-1 rounded-lg border text-xs font-mono transition-colors ${
                    element.width === sz
                      ? 'bg-blue-600 text-white border-blue-600 font-bold'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {sz}px
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Layer Hierarchy */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Urutan Layer (Z-Index: {element.zIndex || 1})
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => onBringForward(element.id)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowUp size={14} weight="bold" />
            <span>Maju ke Depan</span>
          </button>
          <button
            onClick={() => onSendBackward(element.id)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowDown size={14} weight="bold" />
            <span>Mundur ke Belakang</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TEXT ELEMENT SPECIFIC PROPERTIES                                          */}
      {/* ========================================================================= */}
      {element.type === 'text' && (
        <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Pengaturan Teks
          </span>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold">Isi Teks</label>
              <span className="text-[10px] text-slate-400">Variabel Dinamis</span>
            </div>
            <textarea
              rows={2}
              value={element.content || ''}
              onChange={(e) => onUpdateElement(element.id, { content: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-sans"
            />

            {/* Quick Token Insert Chips */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {[
                { label: 'Nama Bisnis', token: '{{businessName}}' },
                { label: 'Lokasi', token: '{{location}}' },
                { label: 'Serial', token: '{{slug}}' },
                { label: 'Badge Invictus', token: '{{branding}}' },
                { label: 'Powered by', token: '{{poweredBy}}' },
                { label: 'Tagline', token: '{{tagline}}' },
              ].map((t) => (
                <button
                  key={t.token}
                  type="button"
                  onClick={() => {
                    const current = element.content || '';
                    const next = current ? `${current} ${t.token}` : t.token;
                    onUpdateElement(element.id, { content: next });
                  }}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors"
                  title={`Klik untuk sisipkan ${t.token}`}
                >
                  +{t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Font Family</label>
            <select
              value={element.fontFamily || 'Outfit, sans-serif'}
              onChange={(e) => onUpdateElement(element.id, { fontFamily: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold block mb-1">Ukuran Font</label>
              <input
                type="number"
                min={8}
                max={96}
                value={element.fontSize || 16}
                onChange={(e) => onUpdateElement(element.id, { fontSize: parseInt(e.target.value) || 16 })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Ketebalan</label>
              <select
                value={element.fontWeight || '600'}
                onChange={(e) => onUpdateElement(element.id, { fontWeight: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="400">Regular (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">SemiBold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">ExtraBold (800)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Perataan Teks</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => onUpdateElement(element.id, { textAlign: 'left' })}
                className={`py-1.5 rounded-lg flex items-center justify-center transition-colors ${
                  element.textAlign === 'left' || !element.textAlign
                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <TextAlignLeft size={16} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => onUpdateElement(element.id, { textAlign: 'center' })}
                className={`py-1.5 rounded-lg flex items-center justify-center transition-colors ${
                  element.textAlign === 'center'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <TextAlignCenter size={16} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => onUpdateElement(element.id, { textAlign: 'right' })}
                className={`py-1.5 rounded-lg flex items-center justify-center transition-colors ${
                  element.textAlign === 'right'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <TextAlignRight size={16} weight="bold" />
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Warna Teks</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                value={element.color || '#000000'}
                onChange={(e) => onUpdateElement(element.id, { color: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-white"
              />
              <input
                type="text"
                value={element.color || '#000000'}
                onChange={(e) => onUpdateElement(element.id, { color: e.target.value })}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onUpdateElement(element.id, { color: c })}
                  style={{ backgroundColor: c }}
                  className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-700 shadow-2xs hover:scale-110 transition-transform"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHAPE ELEMENT PROPERTIES                                                  */}
      {/* ========================================================================= */}
      {element.type === 'shape' && (
        <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Pengaturan Bentuk
          </span>

          <div>
            <label className="text-xs font-semibold block mb-1">Warna Background</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                value={element.backgroundColor || '#ffffff'}
                onChange={(e) => onUpdateElement(element.id, { backgroundColor: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-white"
              />
              <input
                type="text"
                value={element.backgroundColor || '#ffffff'}
                onChange={(e) => onUpdateElement(element.id, { backgroundColor: e.target.value })}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onUpdateElement(element.id, { backgroundColor: c })}
                  style={{ backgroundColor: c }}
                  className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-700 shadow-2xs hover:scale-110 transition-transform"
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold block mb-1">Border Radius</label>
              <input
                type="number"
                min={0}
                max={100}
                value={element.borderRadius || 0}
                onChange={(e) => onUpdateElement(element.id, { borderRadius: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Border Width</label>
              <input
                type="number"
                min={0}
                max={20}
                value={element.borderWidth || 0}
                onChange={(e) => onUpdateElement(element.id, { borderWidth: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NFC ICON SWAPPER & PROPERTIES                                             */}
      {/* ========================================================================= */}
      {element.type === 'nfc_icon' && (
        <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Ganti Style Vektor NFC
            </span>
          </div>

          {/* 6 NFC Visual Swappers */}
          <div className="grid grid-cols-2 gap-2">
            {NFC_LIBRARY.map((item) => {
              const isCurrent = element.iconVariant === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onUpdateElement(element.id, { iconVariant: item.id })}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="shrink-0">{item.icon}</div>
                  <span className="text-[11px] font-semibold truncate leading-tight">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* NFC Accent Color */}
          <div>
            <label className="text-xs font-semibold block mb-1">Warna Vektor NFC</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                value={element.color || '#0284c7'}
                onChange={(e) => onUpdateElement(element.id, { color: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-white"
              />
              <input
                type="text"
                value={element.color || '#0284c7'}
                onChange={(e) => onUpdateElement(element.id, { color: e.target.value })}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onUpdateElement(element.id, { color: c })}
                  style={{ backgroundColor: c }}
                  className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-700 shadow-2xs hover:scale-110 transition-transform"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CUSTOM SVG XML CODE EDITOR                                                */}
      {/* ========================================================================= */}
      {element.type === 'svg' && (
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Code size={14} weight="bold" />
              <span>Kode XML SVG</span>
            </span>
          </div>

          <textarea
            rows={5}
            value={element.svgContent || ''}
            onChange={(e) => onUpdateElement(element.id, { svgContent: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 text-emerald-400 font-mono text-[10px] outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            placeholder="<svg viewBox='0 0 100 100'>...</svg>"
          />
        </div>
      )}
    </div>
  );
}
