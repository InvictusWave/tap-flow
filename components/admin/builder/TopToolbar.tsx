'use client';

import React from 'react';
import Link from 'next/link';
import { TemplateAspect } from '@/types/template-builder';
import {
  ArrowLeft,
  ArrowCounterClockwise,
  ArrowClockwise,
  FloppyDisk,
  Sparkle,
  GridFour,
  Magnet,
} from '@phosphor-icons/react';

interface TopToolbarProps {
  templateName: string;
  onNameChange: (name: string) => void;
  aspect: TemplateAspect;
  onAspectChange: (aspect: TemplateAspect) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  snapToGrid?: boolean;
  onToggleSnap?: () => void;
  gridSize?: number;
  onGridSizeChange?: (size: number) => void;
  onSave: () => void;
  saving: boolean;
  mockBusinessName: string;
  onMockBusinessNameChange: (name: string) => void;
}

export default function TopToolbar({
  templateName,
  onNameChange,
  aspect,
  onAspectChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  showGrid = true,
  onToggleGrid,
  snapToGrid = true,
  onToggleSnap,
  gridSize = 20,
  onGridSizeChange,
  onSave,
  saving,
  mockBusinessName,
  onMockBusinessNameChange,
}: TopToolbarProps) {
  return (
    <header className="sticky top-0 z-40 h-16 shrink-0 border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Back & Template Name */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/admin/templates"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Kembali ke Galeri Template"
        >
          <ArrowLeft size={18} weight="bold" />
        </Link>

        <div className="flex flex-col min-w-0">
          <input
            type="text"
            value={templateName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Beri nama template..."
            className="font-bold text-sm sm:text-base bg-transparent text-slate-900 dark:text-white outline-none border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 px-1 py-0.5 transition-colors truncate max-w-[180px] sm:max-w-[240px]"
          />
          <span className="text-[10px] text-slate-400 font-mono px-1 flex items-center gap-1">
            <Sparkle size={10} weight="fill" className="text-blue-500" />
            Template Studio
          </span>
        </div>
      </div>

      {/* Center: Aspect Ratio & History & Grid Tools */}
      <div className="hidden md:flex items-center gap-2 lg:gap-3">
        {/* Aspect Ratio Switcher */}
        <div className="flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => onAspectChange('square')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              aspect === 'square'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            10x10 cm Stand
          </button>
          <button
            onClick={() => onAspectChange('vertical')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              aspect === 'vertical'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Kartu Vertikal CR80
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Urungkan - Ctrl+Z)"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowCounterClockwise size={16} weight="bold" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ulangi - Ctrl+Y)"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowClockwise size={16} weight="bold" />
          </button>
        </div>

        {/* Grid Bantu & Magnet Controls */}
        <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
          <button
            type="button"
            onClick={onToggleGrid}
            title={showGrid ? 'Sembunyikan Garis Grid Bantu' : 'Tampilkan Garis Grid Bantu'}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              showGrid
                ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
            }`}
          >
            <GridFour size={15} weight={showGrid ? 'bold' : 'regular'} />
            <span className="hidden xl:inline">Grid Bantu</span>
          </button>

          <button
            type="button"
            onClick={onToggleSnap}
            title={snapToGrid ? 'Matikan Magnet Smart Snap' : 'Aktifkan Magnet Smart Snap'}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              snapToGrid
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
            }`}
          >
            <Magnet size={15} weight={snapToGrid ? 'bold' : 'regular'} />
            <span className="hidden xl:inline">Magnet Snap</span>
          </button>

          {showGrid && onGridSizeChange && (
            <select
              value={gridSize}
              onChange={(e) => onGridSizeChange(parseInt(e.target.value) || 20)}
              className="px-1.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300"
              title="Ukuran Kotak Grid"
            >
              <option value={10}>10px</option>
              <option value={20}>20px</option>
              <option value={50}>50px</option>
            </select>
          )}
        </div>

        {/* Zoom Selector */}
        <div className="flex items-center gap-1 text-xs border-l border-slate-200 dark:border-slate-800 pl-2">
          <select
            value={zoom}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
          >
            <option value={0.6}>60%</option>
            <option value={0.75}>75%</option>
            <option value={0.9}>90%</option>
            <option value={1}>100%</option>
            <option value={1.2}>120%</option>
          </select>
        </div>

        {/* Live Mockup Tester */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Test:</span>
          <input
            type="text"
            value={mockBusinessName}
            onChange={(e) => onMockBusinessNameChange(e.target.value)}
            placeholder="Nama Toko..."
            className="w-28 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none"
          />
        </div>
      </div>

      {/* Right: Save Template */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg disabled:bg-slate-400 sm:text-sm"
        >
          <FloppyDisk size={16} weight="bold" />
          <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
        </button>
      </div>
    </header>
  );
}
