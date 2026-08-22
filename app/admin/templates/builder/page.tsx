'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { nanoid } from 'nanoid';
import {
  CustomTemplateData,
  CanvasElement,
  TemplateAspect,
} from '@/types/template-builder';
import { TEMPLATE_PRESETS } from '@/lib/template-presets';
import TopToolbar from '@/components/admin/builder/TopToolbar';
import LeftSidebar from '@/components/admin/builder/LeftSidebar';
import CanvasRenderer from '@/components/admin/builder/CanvasRenderer';
import PropertiesPanel from '@/components/admin/builder/PropertiesPanel';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';

function BuilderContent() {
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get('id');

  // Custom Templates List (fetched from backend)
  const [customTemplatesList, setCustomTemplatesList] = useState<CustomTemplateData[]>([]);

  // Active Template on Canvas
  const [template, setTemplate] = useState<CustomTemplateData>({
    ...TEMPLATE_PRESETS[0],
    id: 'custom-stand',
    name: 'Desain Stand Baru',
  });

  useEffect(() => {
    if (!templateIdParam) {
      setTemplate(prev => ({ ...prev, id: `custom-${nanoid(8)}` }));
    }
  }, [templateIdParam]);

  // Selected Elements (Multi-select IDs)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Zoom & UI state
  const [zoom, setZoom] = useState<number>(1);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<number>(20);
  const [saving, setSaving] = useState<boolean>(false);
  const [mockBusinessName, setMockBusinessName] = useState<string>('Kopi Kenangan Senopati');
  const [saveToast, setSaveToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Load custom templates list and requested template if id param exists
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/templates');
        if (res.ok) {
          const data = await res.json();
          const list: CustomTemplateData[] = data.templates || [];
          setCustomTemplatesList(list.filter((t: any) => t.isCustom));

          if (templateIdParam) {
            const found = list.find((t) => t.id === templateIdParam);
            if (found) {
              setTemplate(found);
              setHistory([found.elements]);
              setHistoryIndex(0);
              return;
            }
          }
        }
      } catch (err) {
        console.error('Error loading template in builder:', err);
      }

      // Default start with Google Quad preset
      setHistory([TEMPLATE_PRESETS[0].elements]);
      setHistoryIndex(0);
    }

    loadData();
  }, [templateIdParam]);

  // Helper to record history on changes
  const pushHistory = useCallback((newElements: CanvasElement[]) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newElements];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Update elements with history recording
  const updateElementsState = useCallback(
    (newElements: CanvasElement[]) => {
      setTemplate((prev) => ({ ...prev, elements: newElements }));
      pushHistory(newElements);
    },
    [pushHistory]
  );

  // Auto-record history for continuous changes (dragging, typing) via debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (historyIndex >= 0 && history[historyIndex]) {
        // Compare with current history frame to avoid duplicate pushes
        const lastFrame = JSON.stringify(history[historyIndex]);
        const currentFrame = JSON.stringify(template.elements);
        if (lastFrame !== currentFrame) {
          pushHistory(template.elements);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [template.elements, history, historyIndex, pushHistory]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setTemplate((prev) => ({ ...prev, elements: history[prevIndex] }));
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setTemplate((prev) => ({ ...prev, elements: history[nextIndex] }));
    }
  }, [history, historyIndex]);

  // Selection Handler
  const handleSelectElement = useCallback((id: string | null, multi = false) => {
    if (!id) {
      setSelectedIds([]);
      return;
    }

    if (multi) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  }, []);

  // Keyboard Shortcuts (Delete, Undo, Redo, Select All)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = document.activeElement as HTMLElement;
      if (
        target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        )
      ) {
        return;
      }

      // Delete selected elements
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          const newElements = template.elements.filter((el) => !selectedIds.includes(el.id));
          setSelectedIds([]);
          updateElementsState(newElements);
        }
      }

      // Select All (Cmd/Ctrl + A)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedIds(template.elements.map((el) => el.id));
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRedo, handleUndo, selectedIds, template.elements, updateElementsState]);

  // Add new element to canvas
  const handleAddElement = (element: CanvasElement) => {
    const newElements = [...template.elements, element];
    setSelectedIds([element.id]);
    updateElementsState(newElements);
  };

  // Update specific element properties
  const handleUpdateElement = (id: string, updates: Partial<CanvasElement>) => {
    const newElements = template.elements.map((el) =>
      el.id === id ? { ...el, ...updates } : el
    );
    setTemplate((prev) => ({ ...prev, elements: newElements }));
  };

  // Update multiple elements simultaneously (e.g. for alignment or multi-drag)
  const handleUpdateMultipleElements = (
    updatesList: { id: string; updates: Partial<CanvasElement> }[]
  ) => {
    const updateMap = new Map(updatesList.map((u) => [u.id, u.updates]));
    const newElements = template.elements.map((el) => {
      const u = updateMap.get(el.id);
      return u ? { ...el, ...u } : el;
    });
    setTemplate((prev) => ({ ...prev, elements: newElements }));
  };

  // Delete element
  const handleDeleteElement = (id: string) => {
    const newElements = template.elements.filter((el) => el.id !== id);
    setSelectedIds((prev) => prev.filter((i) => i !== id));
    updateElementsState(newElements);
  };

  // Delete multiple elements
  const handleDeleteMultipleElements = (ids: string[]) => {
    const newElements = template.elements.filter((el) => !ids.includes(el.id));
    setSelectedIds([]);
    updateElementsState(newElements);
  };

  // Duplicate element
  const handleDuplicateElement = (id: string) => {
    const el = template.elements.find((item) => item.id === id);
    if (!el) return;

    const duplicated: CanvasElement = {
      ...el,
      id: `${el.type}-${nanoid(6)}`,
      x: el.x + 20,
      y: el.y + 20,
      zIndex: (el.zIndex || 1) + 1,
    };

    const newElements = [...template.elements, duplicated];
    setSelectedIds([duplicated.id]);
    updateElementsState(newElements);
  };

  // Duplicate multiple elements
  const handleDuplicateMultipleElements = (ids: string[]) => {
    const toDuplicate = template.elements.filter((item) => ids.includes(item.id));
    if (toDuplicate.length === 0) return;

    const duplicatedList: CanvasElement[] = toDuplicate.map((el) => ({
      ...el,
      id: `${el.type}-${nanoid(6)}`,
      x: el.x + 20,
      y: el.y + 20,
      zIndex: (el.zIndex || 1) + 1,
    }));

    const newElements = [...template.elements, ...duplicatedList];
    setSelectedIds(duplicatedList.map((d) => d.id));
    updateElementsState(newElements);
  };

  // Layer ordering
  const handleBringForward = (id: string) => {
    const newElements = template.elements.map((el) =>
      el.id === id ? { ...el, zIndex: (el.zIndex || 1) + 1 } : el
    );
    updateElementsState(newElements);
  };

  const handleSendBackward = (id: string) => {
    const newElements = template.elements.map((el) =>
      el.id === id ? { ...el, zIndex: Math.max(1, (el.zIndex || 1) - 1) } : el
    );
    updateElementsState(newElements);
  };

  // Apply Preset
  const handleApplyPreset = (preset: CustomTemplateData) => {
    setTemplate({
      ...preset,
      id: template.id.startsWith('custom-') ? template.id : `custom-${nanoid(8)}`,
      name: `${preset.name} (Kustom)`,
    });
    setSelectedIds([]);
    updateElementsState(preset.elements);
  };

  // Background Change
  const handleChangeBackground = (bg: string) => {
    setTemplate((prev) => ({ ...prev, background: bg }));
  };

  // Aspect Ratio Change
  const handleAspectChange = (aspect: TemplateAspect) => {
    const width = aspect === 'vertical' ? 380 : 500;
    const height = aspect === 'vertical' ? 600 : 500;
    setTemplate((prev) => ({
      ...prev,
      aspect,
      width,
      height,
    }));
  };

  // Save Template to Database
  const handleSave = async () => {
    setSaving(true);
    setSaveToast(null);

    try {
      const payload = {
        name: template.name || 'Custom Stand Template',
        aspect: template.aspect || 'square',
        width: template.width || 500,
        height: template.height || 500,
        background: template.background || '#ffffff',
        elements: template.elements,
      };

      let res;
      if (template.id && template.id.startsWith('custom-') && templateIdParam) {
        // Update existing template
        res = await fetch(`/api/admin/templates/${template.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new template
        res = await fetch('/api/admin/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan template');
      }

      const data = await res.json();
      if (data.template?.id) {
        setTemplate((prev) => ({ ...prev, id: data.template.id }));
      }

      setSaveToast({
        type: 'success',
        message: 'Template kustom berhasil disimpan ke database!',
      });
      setTimeout(() => setSaveToast(null), 4000);
    } catch (err: any) {
      setSaveToast({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat menyimpan',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedElement =
    selectedIds.length === 1
      ? template.elements.find((el) => el.id === selectedIds[0]) || null
      : null;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
      {/* Top Toolbar */}
      <TopToolbar
        templateName={template.name}
        onNameChange={(name) => setTemplate((prev) => ({ ...prev, name }))}
        aspect={template.aspect}
        onAspectChange={handleAspectChange}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={setZoom}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
        onSave={handleSave}
        saving={saving}
        mockBusinessName={mockBusinessName}
        onMockBusinessNameChange={setMockBusinessName}
      />

      {/* Save Notification Toast */}
      {saveToast && (
        <div
          className={`absolute top-20 right-8 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 ${
            saveToast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200'
          }`}
        >
          {saveToast.type === 'success' ? (
            <CheckCircle size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
          ) : (
            <WarningCircle size={18} weight="fill" className="text-rose-600 dark:text-rose-400" />
          )}
          <span>{saveToast.message}</span>
        </div>
      )}

      {/* Main Studio 3-Column Layout: Left Tools | Center Canvas Workspace | Right Inspector */}
      <div className="flex-1 flex w-full h-[calc(100vh-64px)] overflow-hidden relative">
        {/* Left Tools Sidebar */}
        <LeftSidebar
          onAddElement={handleAddElement}
          onApplyPreset={handleApplyPreset}
          onChangeBackground={handleChangeBackground}
          customTemplatesList={customTemplatesList}
        />

        {/* Center Canvas Workspace */}
        <main
          className="flex-1 overflow-auto flex items-center justify-center p-8 sm:p-12 relative bg-slate-200/70 dark:bg-slate-950"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(148, 163, 184, 0.15) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <div 
            className="relative shadow-2xl rounded-3xl"
            style={{
              width: (template.width || 500) * zoom,
              height: (template.height || 500) * zoom,
            }}
          >
            <div 
              className="absolute inset-0 origin-top-left rounded-[inherit]"
              style={{ transform: `scale(${zoom})`, width: template.width || 500, height: template.height || 500 }}
            >
              <CanvasRenderer
                template={template}
                scale={1}
                interactive={true}
                selectedIds={selectedIds}
                showGrid={showGrid}
                snapToGrid={snapToGrid}
                gridSize={gridSize}
                onSelectElement={handleSelectElement}
                onSetSelectedIds={setSelectedIds}
                onSelectMultipleElements={setSelectedIds}
                onUpdateElement={handleUpdateElement}
                onUpdateMultipleElements={handleUpdateMultipleElements}
                mockData={{
                  businessName: mockBusinessName,
                  location: 'Cabang Senopati, Jakarta',
                  slug: 'demo-card',
                  url: 'https://tapflow.vercel.app/c/demo-card'
                }}
              />
            </div>
          </div>
        </main>

        {/* Right Properties Inspector Panel */}
        <PropertiesPanel
          element={selectedElement}
          selectedIds={selectedIds}
          allElements={template.elements}
          canvasWidth={template.width || 500}
          canvasHeight={template.height || 500}
          onUpdateElement={handleUpdateElement}
          onUpdateMultipleElements={handleUpdateMultipleElements}
          onDeleteElement={handleDeleteElement}
          onDeleteMultipleElements={handleDeleteMultipleElements}
          onDuplicateElement={handleDuplicateElement}
          onDuplicateMultipleElements={handleDuplicateMultipleElements}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
        />
      </div>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-slate-900 text-white font-semibold">
          Memuat Card Template Studio...
        </div>
      }
    >
      <BuilderContent />
    </Suspense>
  );
}
