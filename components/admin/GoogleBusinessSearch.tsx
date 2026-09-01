'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  SpinnerGap,
  CaretRight,
} from '@phosphor-icons/react';
import type { GoogleReviewPlace } from '@/lib/google-review';

export interface SelectedPlace {
  name: string;
  location: string;
  googleReviewUrl: string;
  recommendedSlug: string;
}

interface Props {
  onSelect: (place: SelectedPlace) => void;
  placeholder?: string;
  initialQuery?: string;
}

export default function GoogleBusinessSearch({
  onSelect,
  placeholder = 'Ketik nama toko, cafe, atau bisnis Anda...',
  initialQuery = '',
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<GoogleReviewPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: GoogleReviewPlace) => {
    const cleanName = item.name.trim();
    const cleanSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24);

    onSelect({
      name: cleanName,
      location: item.location || '',
      googleReviewUrl: item.googleReviewUrl,
      recommendedSlug: cleanSlug,
    });

    setQuery(cleanName);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Clean Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length < 2) {
              setResults([]);
              setIsOpen(false);
            }
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 transition-all shadow-xs"
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-600">
            <SpinnerGap size={18} weight="bold" className="animate-spin" />
          </div>
        )}
      </div>

      {/* Rapi, Luas, & Elegan: Floating Dropdown Modal Hasil Pencarian Google Maps */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-2.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="px-5 py-3 bg-slate-50/90 dark:bg-slate-800/90 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xs border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Pilih Bisnis dari Google Maps
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {results.length} hasil
            </span>
          </div>

          {/* List items with spacious padding and clean pin card */}
          {results.map((item, idx) => (
            <button
              key={item.placeId || idx}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full p-4 sm:p-5 text-left hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-all flex items-start gap-4 group cursor-pointer"
            >
              {/* Spacious & Proportional Pin Badge */}
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
                <MapPin size={20} weight="fill" />
              </div>

              {/* Text content with clean spacing */}
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                  {item.name}
                </p>

                {item.location && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.location}
                  </p>
                )}
              </div>

              {/* Subtle Chevron indicator on hover */}
              <div className="shrink-0 self-center">
                <CaretRight
                  size={16}
                  weight="bold"
                  className="text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
