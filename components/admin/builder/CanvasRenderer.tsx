'use client';

import React, { useRef, useState } from 'react';
import CustomQR from './CustomQR';
import NfcIconGraphic from './NfcIconGraphic';
import {
  CanvasElement,
  CustomTemplateData,
} from '@/types/template-builder';

interface Props {
  template: CustomTemplateData;
  scale?: number;
  interactive?: boolean;
  selectedElementId?: string | null;
  selectedElementIds?: string[];
  selectedIds?: string[];
  showGrid?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  onSelectElement?: (id: string | null, multi?: boolean) => void;
  onSetSelectedIds?: React.Dispatch<React.SetStateAction<string[]>>;
  onSelectMultipleElements?: (ids: string[]) => void;
  onUpdateElement?: (id: string, updates: Partial<CanvasElement>) => void;
  onUpdateMultipleElements?: (updates: { id: string; updates: Partial<CanvasElement> }[]) => void;
  mockData?: {
    businessName?: string;
    location?: string;
    slug?: string;
    url?: string;
    showBranding?: boolean;
  };
  transparentBackground?: boolean;
}

interface SmartGuide {
  type: 'v' | 'h';
  pos: number;
  label?: string;
}

export default function CanvasRenderer({
  template,
  scale = 1,
  interactive = true,
  selectedElementId = null,
  selectedElementIds = [],
  selectedIds = [],
  showGrid = true,
  snapToGrid = true,
  gridSize = 20,
  onSelectElement,
  onSetSelectedIds,
  onSelectMultipleElements,
  onUpdateElement,
  onUpdateMultipleElements,
  mockData = {
    businessName: 'Kopi Kenangan',
    location: 'Senopati, Jakarta Selatan',
    slug: 'demo-card',
    showBranding: true,
  },
  transparentBackground = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetUrl = mockData.url || `https://tapflow.id/c/${mockData.slug || 'demo-card'}`;

  // Combined selected IDs array
  const activeSelectedIds = selectedIds.length > 0
    ? selectedIds
    : (selectedElementIds.length > 0 ? selectedElementIds : (selectedElementId ? [selectedElementId] : []));

  // Active Smart Guides (Lines shown during drag)
  const [activeGuides, setActiveGuides] = useState<SmartGuide[]>([]);

  // Replace dynamic template tokens with accurate branding & business name controls
  const formatTextContent = (text?: string) => {
    if (!text) return '';

    const resolvedBusinessName =
      mockData.businessName !== undefined
        ? mockData.businessName
        : (interactive ? 'Kopi Kenangan' : '');

    const resolvedLocation =
      mockData.location !== undefined
        ? mockData.location
        : (interactive ? 'Senopati, Jakarta Selatan' : '');

    const resolvedSlug = mockData.slug || (interactive ? 'demo-card' : '');

    const isBrandingEnabled =
      mockData.showBranding !== undefined ? mockData.showBranding : (interactive ? true : false);

    const resolvedBranding = isBrandingEnabled ? 'Powered by InvictusWave' : '';
    const resolvedPoweredBy = isBrandingEnabled ? 'Powered by InvictusWave' : '';
    const resolvedInvictus = isBrandingEnabled ? 'InvictusWave' : '';
    const resolvedTagline = isBrandingEnabled ? 'TapFlow by InvictusWave' : '';

    let formatted = text
      .replace(/{{businessName}}/g, resolvedBusinessName)
      .replace(/{{location}}/g, resolvedLocation)
      .replace(/{{slug}}/g, resolvedSlug)
      .replace(/{{url}}/g, targetUrl)
      .replace(/{{branding}}/g, resolvedBranding)
      .replace(/{{poweredBy}}/g, resolvedPoweredBy)
      .replace(/{{invictus}}/g, resolvedInvictus)
      .replace(/{{tagline}}/g, resolvedTagline);

    if (!isBrandingEnabled) {
      formatted = formatted
        .replace(/powered by invictuswave/gi, '')
        .replace(/tapflow by invictuswave/gi, '')
        .replace(/invictuswave/gi, '')
        .trim();
    }

    return formatted;
  };

  const canvasWidth = template.width || 500;
  const canvasHeight = template.height || 500;
  const borderRadius = template.aspect === 'vertical' ? 24 : 36;

  // Dragging & Resizing & Marquee Selection state
  const [activeDrag, setActiveDrag] = useState<{
    primaryId: string;
    startX: number;
    startY: number;
    initialPositions: { id: string; x: number; y: number; width: number; height: number }[];
  } | null>(null);

  const [activeResize, setActiveResize] = useState<{
    id: string;
    handle: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
  } | null>(null);

  // Marquee (Box Drag Selection) state
  const [marqueeBox, setMarqueeBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    hasMoved: boolean;
  } | null>(null);

  // Helper to determine if element is selected
  const isSelected = (id: string) => {
    if (!interactive) return false;
    return activeSelectedIds.includes(id);
  };

  // -------------------------------------------------------------
  // Pointer down on element (Drag or Multi-Select)
  // -------------------------------------------------------------
  const handleElementPointerDown = (e: React.PointerEvent, el: CanvasElement) => {
    if (!interactive) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

    const isMultiKey = e.shiftKey || e.metaKey || e.ctrlKey;

    let nextSelectedIds: string[] = [];

    if (isMultiKey) {
      // Toggle selection in multi-select mode
      if (activeSelectedIds.includes(el.id)) {
        nextSelectedIds = activeSelectedIds.filter((id) => id !== el.id);
      } else {
        nextSelectedIds = [...activeSelectedIds, el.id];
      }
    } else {
      // If already part of selected group, preserve selection to drag together
      if (activeSelectedIds.includes(el.id) && activeSelectedIds.length > 1) {
        nextSelectedIds = activeSelectedIds;
      } else {
        // Single element selection
        nextSelectedIds = [el.id];
      }
    }

    if (onSetSelectedIds) {
      onSetSelectedIds(nextSelectedIds);
    } else if (onSelectMultipleElements) {
      onSelectMultipleElements(nextSelectedIds);
    } else if (onSelectElement) {
      onSelectElement(nextSelectedIds.length === 1 ? nextSelectedIds[0] : null, isMultiKey);
    }

    // Setup dragging for all items in the selection
    const targetElements = template.elements.filter((elem) => nextSelectedIds.includes(elem.id));
    const elementsToDrag = targetElements.length > 0 ? targetElements : [el];

    setActiveDrag({
      primaryId: el.id,
      startX: e.clientX,
      startY: e.clientY,
      initialPositions: elementsToDrag.map((item) => ({
        id: item.id,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
      })),
    });
  };

  // -------------------------------------------------------------
  // Pointer down on Resize Handle
  // -------------------------------------------------------------
  const handleResizePointerDown = (e: React.PointerEvent, el: CanvasElement, handle: string) => {
    if (!interactive) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

    setActiveResize({
      id: el.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialX: el.x,
      initialY: el.y,
      initialW: el.width,
      initialH: el.height,
    });
  };

  // -------------------------------------------------------------
  // Pointer down on Canvas Background (Deselect or Marquee Start)
  // -------------------------------------------------------------
  const handleCanvasBackgroundPointerDown = (e: React.PointerEvent) => {
    if (!interactive || !containerRef.current) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setMarqueeBox({
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      hasMoved: false,
    });
  };

  // -------------------------------------------------------------
  // Global Pointer Move
  // -------------------------------------------------------------
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!interactive) return;

    // 1. Resizing with Grid Snapping
    if (activeResize && onUpdateElement) {
      const dx = (e.clientX - activeResize.startX) / scale;
      const dy = (e.clientY - activeResize.startY) / scale;
      const { handle, initialX, initialY, initialW, initialH } = activeResize;

      let newX = initialX;
      let newY = initialY;
      let newW = initialW;
      let newH = initialH;

      if (handle.includes('e')) newW = Math.max(10, initialW + dx);
      if (handle.includes('s')) newH = Math.max(10, initialH + dy);
      if (handle.includes('w')) {
        const potentialW = initialW - dx;
        if (potentialW >= 10) {
          newW = potentialW;
          newX = initialX + dx;
        }
      }
      if (handle.includes('n')) {
        const potentialH = initialH - dy;
        if (potentialH >= 10) {
          newH = potentialH;
          newY = initialY + dy;
        }
      }

      // Snap dimensions to grid if enabled
      if (snapToGrid) {
        newW = Math.round(newW / 5) * 5;
        newH = Math.round(newH / 5) * 5;
        newX = Math.round(newX / 5) * 5;
        newY = Math.round(newY / 5) * 5;
      }

      onUpdateElement(activeResize.id, {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
      });
      return;
    }

    // 2. Dragging Single or Multi Elements with Smart Magnet Guides
    if (activeDrag) {
      let dx = (e.clientX - activeDrag.startX) / scale;
      let dy = (e.clientY - activeDrag.startY) / scale;

      const primary = activeDrag.initialPositions.find((p) => p.id === activeDrag.primaryId) || activeDrag.initialPositions[0];
      const targetPrimaryX = primary.x + dx;
      const targetPrimaryY = primary.y + dy;

      const newGuides: SmartGuide[] = [];

      // Smart Alignment & Center Snap
      if (snapToGrid) {
        const canvasCenterX = canvasWidth / 2;
        const canvasCenterY = canvasHeight / 2;
        const primaryCenterX = targetPrimaryX + primary.width / 2;
        const primaryCenterY = targetPrimaryY + primary.height / 2;

        const SNAP_TOLERANCE = 5;

        // Snap X Center to Canvas Center
        if (Math.abs(primaryCenterX - canvasCenterX) < SNAP_TOLERANCE) {
          const snappedX = canvasCenterX - primary.width / 2;
          dx = snappedX - primary.x;
          newGuides.push({ type: 'v', pos: canvasCenterX, label: 'Tengah Kanvas H' });
        } else if (Math.abs(targetPrimaryX - 20) < SNAP_TOLERANCE) {
          // Snap Left Margin (20px)
          dx = 20 - primary.x;
          newGuides.push({ type: 'v', pos: 20, label: 'Margin Kiri 20px' });
        } else if (Math.abs(targetPrimaryX + primary.width - (canvasWidth - 20)) < SNAP_TOLERANCE) {
          // Snap Right Margin
          dx = canvasWidth - 20 - primary.width - primary.x;
          newGuides.push({ type: 'v', pos: canvasWidth - 20, label: 'Margin Kanan 20px' });
        }

        // Snap Y Center to Canvas Center
        if (Math.abs(primaryCenterY - canvasCenterY) < SNAP_TOLERANCE) {
          const snappedY = canvasCenterY - primary.height / 2;
          dy = snappedY - primary.y;
          newGuides.push({ type: 'h', pos: canvasCenterY, label: 'Tengah Kanvas V' });
        } else if (Math.abs(targetPrimaryY - 20) < SNAP_TOLERANCE) {
          // Snap Top Margin
          dy = 20 - primary.y;
          newGuides.push({ type: 'h', pos: 20, label: 'Margin Atas 20px' });
        } else if (Math.abs(targetPrimaryY + primary.height - (canvasHeight - 20)) < SNAP_TOLERANCE) {
          // Snap Bottom Margin
          dy = canvasHeight - 20 - primary.height - primary.y;
          newGuides.push({ type: 'h', pos: canvasHeight - 20, label: 'Margin Bawah 20px' });
        }

        // Check alignment with other non-selected elements
        const otherElements = template.elements.filter((el) => !activeSelectedIds.includes(el.id));
        for (const other of otherElements) {
          const otherCenterX = other.x + other.width / 2;
          const otherCenterY = other.y + other.height / 2;
          const otherRight = other.x + other.width;
          const otherBottom = other.y + other.height;

          // X Alignments
          if (!newGuides.some((g) => g.type === 'v')) {
            if (Math.abs(primaryCenterX - otherCenterX) < SNAP_TOLERANCE) {
              dx = otherCenterX - primary.width / 2 - primary.x;
              newGuides.push({ type: 'v', pos: otherCenterX, label: 'Tengah' });
            } else if (Math.abs(targetPrimaryX - other.x) < SNAP_TOLERANCE) {
              dx = other.x - primary.x;
              newGuides.push({ type: 'v', pos: other.x, label: 'Kiri' });
            } else if (Math.abs(targetPrimaryX + primary.width - otherRight) < SNAP_TOLERANCE) {
              dx = otherRight - primary.width - primary.x;
              newGuides.push({ type: 'v', pos: otherRight, label: 'Kanan' });
            } else if (Math.abs(targetPrimaryX - otherRight) < SNAP_TOLERANCE) {
              dx = otherRight - primary.x;
              newGuides.push({ type: 'v', pos: otherRight, label: 'Kanan-Kiri' });
            } else if (Math.abs(targetPrimaryX + primary.width - other.x) < SNAP_TOLERANCE) {
              dx = other.x - primary.width - primary.x;
              newGuides.push({ type: 'v', pos: other.x, label: 'Kiri-Kanan' });
            }
          }

          // Y Alignments
          if (!newGuides.some((g) => g.type === 'h')) {
            if (Math.abs(primaryCenterY - otherCenterY) < SNAP_TOLERANCE) {
              dy = otherCenterY - primary.height / 2 - primary.y;
              newGuides.push({ type: 'h', pos: otherCenterY, label: 'Tengah' });
            } else if (Math.abs(targetPrimaryY - other.y) < SNAP_TOLERANCE) {
              dy = other.y - primary.y;
              newGuides.push({ type: 'h', pos: other.y, label: 'Atas' });
            } else if (Math.abs(targetPrimaryY + primary.height - otherBottom) < SNAP_TOLERANCE) {
              dy = otherBottom - primary.height - primary.y;
              newGuides.push({ type: 'h', pos: otherBottom, label: 'Bawah' });
            } else if (Math.abs(targetPrimaryY - otherBottom) < SNAP_TOLERANCE) {
              dy = otherBottom - primary.y;
              newGuides.push({ type: 'h', pos: otherBottom, label: 'Bawah-Atas' });
            } else if (Math.abs(targetPrimaryY + primary.height - other.y) < SNAP_TOLERANCE) {
              dy = other.y - primary.height - primary.y;
              newGuides.push({ type: 'h', pos: other.y, label: 'Atas-Bawah' });
            }
          }
        }
      }

      setActiveGuides(newGuides);

      if (activeDrag.initialPositions.length > 1 && onUpdateMultipleElements) {
        const batchUpdates = activeDrag.initialPositions.map((item) => ({
          id: item.id,
          updates: {
            x: Math.round(item.x + dx),
            y: Math.round(item.y + dy),
          },
        }));
        onUpdateMultipleElements(batchUpdates);
      } else if (activeDrag.initialPositions.length === 1 && onUpdateElement) {
        const single = activeDrag.initialPositions[0];
        onUpdateElement(single.id, {
          x: Math.round(single.x + dx),
          y: Math.round(single.y + dy),
        });
      }
      return;
    }

    // 3. Marquee Box Dragging (Lasso Multi-Select)
    if (marqueeBox && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const curX = (e.clientX - rect.left) / scale;
      const curY = (e.clientY - rect.top) / scale;

      const dist = Math.hypot(curX - marqueeBox.startX, curY - marqueeBox.startY);
      const hasMoved = dist > 3;

      setMarqueeBox((prev) => (prev ? { ...prev, currentX: curX, currentY: curY, hasMoved } : null));

      if (hasMoved) {
        // Calculate intersection with elements
        const mLeft = Math.min(marqueeBox.startX, curX);
        const mTop = Math.min(marqueeBox.startY, curY);
        const mRight = Math.max(marqueeBox.startX, curX);
        const mBottom = Math.max(marqueeBox.startY, curY);

        const intersectingIds = template.elements
          .filter((el) => {
            const elRight = el.x + el.width;
            const elBottom = el.y + el.height;
            return el.x < mRight && elRight > mLeft && el.y < mBottom && elBottom > mTop;
          })
          .map((el) => el.id);

        if (onSetSelectedIds) {
          onSetSelectedIds(intersectingIds);
        } else if (onSelectMultipleElements) {
          onSelectMultipleElements(intersectingIds);
        } else if (onSelectElement) {
          if (intersectingIds.length === 1) {
            onSelectElement(intersectingIds[0]);
          } else if (intersectingIds.length === 0) {
            onSelectElement(null);
          }
        }
      }
    }
  };

  // -------------------------------------------------------------
  // Pointer Up
  // -------------------------------------------------------------
  const handlePointerUp = () => {
    // If marquee was clicked but not dragged, clear selection (Canvas background click)
    if (marqueeBox && !marqueeBox.hasMoved) {
      if (onSetSelectedIds) {
        onSetSelectedIds([]);
      } else if (onSelectMultipleElements) {
        onSelectMultipleElements([]);
      } else if (onSelectElement) {
        onSelectElement(null);
      }
    }

    setActiveDrag(null);
    setActiveResize(null);
    setMarqueeBox(null);
    setActiveGuides([]);
  };

  // Render Google Star Ratings
  const renderGoogleStars = (el: CanvasElement) => {
    const starColor = el.starColor || el.color || '#FBBC05';
    const starCount = el.starCount || (el.content === 'google_1_star' ? 1 : 5);

    return (
      <div className="flex items-center justify-center gap-1.5 w-full h-full pointer-events-none">
        {Array.from({ length: starCount }).map((_, i) => (
          <svg key={i} viewBox="0 0 24 24" className="w-full h-full max-w-[40px] drop-shadow-xs" fill={starColor}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
    );
  };

  // Render Google Logos
  const renderGoogleLogo = (el: CanvasElement) => {
    const content = el.content || 'g_icon';

    if (content === 'google_reviews_badge') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-md border border-slate-200 pointer-events-none">
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="text-xs font-bold text-slate-800">Google Reviews</span>
        </div>
      );
    }

    if (content === 'google_wordmark') {
      return (
        <svg viewBox="0 0 272 92" className="w-full h-full pointer-events-none">
          <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335" />
          <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05" />
          <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4" />
          <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853" />
          <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335" />
          <path d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35 0 53.79 0 34.68S16.32 0 35.29 0c9.91 0 17.06 3.86 22.35 8.99l-6.3 6.3c-3.87-3.61-9.07-6.38-16.05-6.38-13.02 0-23.36 10.58-23.36 23.69s10.33 23.69 23.36 23.69c8.49 0 13.36-3.36 16.47-6.47 2.52-2.52 4.12-6.13 4.79-11.17H35.29z" fill="#4285F4" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24" className="w-full h-full pointer-events-none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    );
  };

  // Render individual element
  const renderElement = (el: CanvasElement) => {
    const selected = isSelected(el.id);
    const textContent = el.type === 'text' ? formatTextContent(el.content) : '';

    // If text element resolved to empty string and not interactive, don't render empty block
    if (el.type === 'text' && !textContent && !interactive) {
      return null;
    }

    return (
      <div
        key={el.id}
        onPointerDown={(e) => handleElementPointerDown(e, el)}
        style={{
          position: 'absolute',
          left: `${el.x}px`,
          top: `${el.y}px`,
          width: `${el.width}px`,
          height: `${el.height}px`,
          zIndex: el.zIndex || 1,
          transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
          opacity: el.opacity !== undefined ? el.opacity : 1,
          userSelect: 'none',
        }}
        className={`group ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : (interactive ? 'hover:ring-1 hover:ring-blue-300' : '')}`}
      >
        {/* Element Contents */}
        {el.type === 'text' && (
          <div
            style={{
              fontSize: `${el.fontSize || 16}px`,
              fontWeight: el.fontWeight || 'normal',
              fontStyle: el.fontStyle || 'normal',
              color: el.color || '#000000',
              fontFamily: el.fontFamily || 'Outfit, sans-serif',
              letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
              lineHeight: el.lineHeight || 1.25,
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                el.textAlign === 'center'
                  ? 'center'
                  : el.textAlign === 'right'
                  ? 'flex-end'
                  : 'flex-start',
              width: '100%',
              height: '100%',
            }}
            className="overflow-hidden whitespace-pre-wrap select-none"
          >
            <span
              style={{
                textAlign: el.textAlign || 'left',
                width: el.textAlign === 'center' ? '100%' : 'auto',
                display: 'block',
              }}
            >
              {textContent}
            </span>
          </div>
        )}

        {el.type === 'shape' && (
          <div
            style={{
              backgroundColor: el.backgroundColor || 'transparent',
              borderColor: el.borderColor || 'transparent',
              borderWidth: el.borderWidth ? `${el.borderWidth}px` : 0,
              borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0,
              boxShadow: el.boxShadow || 'none',
            }}
            className="w-full h-full pointer-events-none"
          />
        )}

        {el.type === 'qr' && (
          <div
            style={{
              backgroundColor: el.backgroundColor || '#ffffff',
              borderColor: el.borderColor || 'transparent',
              borderWidth: 0,
              borderRadius: el.borderRadius ? `${el.borderRadius}px` : 8,
              boxShadow: el.boxShadow || 'none',
              color: el.qrDarkColor || '#000000',
            }}
            className={`w-full h-full flex items-center justify-center pointer-events-none relative overflow-hidden ${!el.qrVariant || el.qrVariant === 'standard' ? 'p-1' : 'p-3'}`}
          >
            {/* Variant: Outline */}
            {el.qrVariant === 'outline' && (
              <div className="absolute inset-1 border-2 border-current rounded-md opacity-30 pointer-events-none" />
            )}

            {el.qrVariant === 'rounded_frame' && (
              <div className="absolute inset-1 border-2 border-current rounded-2xl opacity-40 pointer-events-none" />
            )}

            {el.qrVariant === 'double_frame' && (
              <div className="absolute inset-1 border-4 border-double border-current rounded-lg opacity-40 pointer-events-none" />
            )}

            {el.qrVariant === 'bold_frame' && (
              <div className="absolute inset-1 border-4 border-current rounded-lg opacity-50 pointer-events-none" />
            )}

            {/* Variant: Scan Corners */}
            {el.qrVariant === 'scan_corners' && (
              <>
                <div className="absolute top-1 left-1 w-4 h-4 border-t-4 border-l-4 rounded-tl-md border-slate-300" />
                <div className="absolute top-1 right-1 w-4 h-4 border-t-4 border-r-4 rounded-tr-md border-slate-300" />
                <div className="absolute bottom-1 left-1 w-4 h-4 border-b-4 border-l-4 rounded-bl-md border-slate-300" />
                <div className="absolute bottom-1 right-1 w-4 h-4 border-b-4 border-r-4 rounded-br-md border-slate-300" />
              </>
            )}

            {/* Variant: Solid Frame */}
            {el.qrVariant === 'solid_frame' && (
              <div className="absolute inset-1 border-2 border-dashed border-slate-200 rounded-md pointer-events-none" />
            )}

            <div className="w-full h-full relative">
              <CustomQR
                data={targetUrl}
                dotStyle={el.qrDotStyle || 'square'}
                cornerStyle={el.qrCornerStyle || 'square'}
                color={el.qrDarkColor || '#000000'}
                width={el.width}
                height={el.height}
              />
              
              {/* Embedded Logo in Center if Solid Frame variant */}
              {el.qrVariant === 'solid_frame' && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 bg-white rounded-md shadow-sm border border-slate-100 flex items-center justify-center p-[2px]">
                  <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM8.66859 7.93767C8.64917 7.75318 8.54474 7.58024 8.3718 7.48038C8.26596 7.41928 8.14923 7.39408 8.03574 7.40102C7.91551 7.39374 7.79193 7.42249 7.682 7.4912C7.50792 7.6 7.4089 7.78346 7.4005 7.97413C6.74423 9.21292 6.4 10.5949 6.4 12C6.4 13.5096 6.79737 14.9926 7.55218 16.3C7.71787 16.587 8.08482 16.6853 8.3718 16.5196C8.65877 16.3539 8.7571 15.987 8.59141 15.7C7.94193 14.5751 7.6 13.299 7.6 12C7.6 11.0746 7.77352 10.1609 8.10815 9.30511L12.3314 16.0623C12.3508 16.2468 12.4553 16.4198 12.6282 16.5196C12.734 16.5807 12.8508 16.6059 12.9643 16.599C13.0845 16.6063 13.2081 16.5775 13.318 16.5088C13.4921 16.4 13.5911 16.2165 13.5995 16.0259C14.2558 14.7871 14.6 13.4051 14.6 12C14.6 10.4904 14.2026 9.00737 13.4478 7.7C13.2821 7.41302 12.9152 7.3147 12.6282 7.48038C12.3412 7.64607 12.2429 8.01302 12.4086 8.3C13.0581 9.42494 13.4 10.701 13.4 12C13.4 12.9254 13.2265 13.8391 12.8919 14.6949L8.66859 7.93767ZM16.0067 6.8C15.841 6.51302 15.9393 6.14607 16.2263 5.98038C16.5133 5.8147 16.8802 5.91302 17.0459 6.2C18.064 7.96342 18.6 9.96377 18.6 12C18.6 14.0362 18.064 16.0366 17.0459 17.8C16.8802 18.087 16.5133 18.1853 16.2263 18.0196C15.9393 17.8539 15.841 17.487 16.0067 17.2C16.9195 15.619 17.4 13.8256 17.4 12C17.4 10.1744 16.9195 8.381 16.0067 6.8Z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        )}

        {el.type === 'google_logo' && renderGoogleLogo(el)}
        {el.type === 'stars' && renderGoogleStars(el)}
        {el.type === 'nfc_icon' && (
          <NfcIconGraphic
            variant={el.iconVariant}
            color={el.color || (el.isDark ? '#ffffff' : '#0f172a')}
            className="w-full h-full pointer-events-none"
          />
        )}

        {el.type === 'svg' && el.svgContent && (
          <div
            className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full pointer-events-none"
            dangerouslySetInnerHTML={{ __html: el.svgContent }}
          />
        )}

        {el.type === 'divider_or' && (
          <div className="w-full h-full flex flex-col items-center justify-between py-1 select-none pointer-events-none">
            <div className="w-[1.5px] flex-1 bg-slate-300 dark:bg-slate-700" />
            <span
              style={{
                color: el.color || '#64748b',
                fontSize: `${el.fontSize || 11}px`,
                fontWeight: el.fontWeight || '700',
              }}
              className="my-1 uppercase tracking-widest font-mono select-none"
            >
              {el.content || 'OR'}
            </span>
            <div className="w-[1.5px] flex-1 bg-slate-300 dark:bg-slate-700" />
          </div>
        )}

        {el.type === 'image' && (
          <div className="w-full h-full overflow-hidden pointer-events-none" style={{ borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0 }}>
            {el.content ? (
              // Canvas images may be data URLs, which next/image does not support efficiently.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={el.content} alt="Element" className="w-full h-full object-cover pointer-events-none" />
            ) : (
              <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                Gambar
              </div>
            )}
          </div>
        )}

        {/* 8 Precise Resize Handles when selected */}
        {selected && interactive && (
          <>
            {/* 4 Corners */}
            <div
              onPointerDown={(e) => handleResizePointerDown(e, el, 'nw')}
              className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize shadow-md z-30"
            />
            <div
              onPointerDown={(e) => handleResizePointerDown(e, el, 'ne')}
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize shadow-md z-30"
            />
            <div
              onPointerDown={(e) => handleResizePointerDown(e, el, 'sw')}
              className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize shadow-md z-30"
            />
            <div
              onPointerDown={(e) => handleResizePointerDown(e, el, 'se')}
              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize shadow-md z-30"
            />

            {/* 4 Edge Handles */}
            <div
              onPointerDown={(e) => handleResizePointerDown(e, el, 'n')}
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-blue-600 border border-white rounded-sm cursor-ns-resize z-30"
            />
            <div
              onPointerDown={(e) => handleResizePointerDown(e, el, 's')}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-blue-600 border border-white rounded-sm cursor-ns-resize z-30"
            />
            <div
              onPointerDown={(e) => handleResizePointerDown(e, el, 'w')}
              className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-4 bg-blue-600 border border-white rounded-sm cursor-ew-resize z-30"
            />
            <div
              onPointerDown={(e) => handleResizePointerDown(e, el, 'e')}
              className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-4 bg-blue-600 border border-white rounded-sm cursor-ew-resize z-30"
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handleCanvasBackgroundPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        background: transparentBackground ? 'transparent' : (template.background || '#ffffff'),
        borderRadius: transparentBackground ? '0px' : `${borderRadius}px`,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'center center',
      }}
      className={`relative shadow-2xl overflow-hidden select-none border border-slate-200/50 ${interactive ? 'cursor-default' : 'pointer-events-none'}`}
    >
      {/* Grid Bantu Overlay */}
      {showGrid && interactive && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="canvas-grid-pattern" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
              <circle cx={gridSize / 2} cy={gridSize / 2} r="1" fill="#3b82f6" opacity="0.6" />
              <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="#94a3b8" strokeWidth="0.5" opacity="0.35" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#canvas-grid-pattern)" />
        </svg>
      )}

      {/* Elements Layer */}
      {template.elements.map(renderElement)}

      {/* Smart Guidelines (Magenta / Rose Magnet Guides) */}
      {activeGuides.map((guide, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            left: guide.type === 'v' ? `${guide.pos}px` : 0,
            top: guide.type === 'h' ? `${guide.pos}px` : 0,
            width: guide.type === 'v' ? '1.5px' : '100%',
            height: guide.type === 'h' ? '1.5px' : '100%',
            zIndex: 998,
          }}
          className="bg-rose-500 pointer-events-none shadow-xs flex items-center justify-center"
        >
          {guide.label && (
            <span
              style={{
                position: 'absolute',
                top: guide.type === 'v' ? '12px' : '-18px',
                left: guide.type === 'h' ? '12px' : '6px',
              }}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold shadow-md whitespace-nowrap z-50 pointer-events-none"
            >
              {guide.label}
            </span>
          )}
        </div>
      ))}

      {/* Marquee Selection Rectangle Box */}
      {marqueeBox && marqueeBox.hasMoved && interactive && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(marqueeBox.startX, marqueeBox.currentX)}px`,
            top: `${Math.min(marqueeBox.startY, marqueeBox.currentY)}px`,
            width: `${Math.abs(marqueeBox.currentX - marqueeBox.startX)}px`,
            height: `${Math.abs(marqueeBox.currentY - marqueeBox.startY)}px`,
            zIndex: 999,
          }}
          className="border-2 border-dashed border-blue-500 bg-blue-500/15 pointer-events-none rounded-md"
        />
      )}
    </div>
  );
}
