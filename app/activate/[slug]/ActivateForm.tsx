'use client';

import React, { useState } from 'react';
import GoogleBusinessSearch, { SelectedPlace } from '@/components/admin/GoogleBusinessSearch';
import { isDirectGoogleReviewUrl } from '@/lib/google-review';
import {
  MapPin,
  CheckCircle,
  WarningCircle,
  ArrowsClockwise,
  ArrowSquareOut,
  ShieldCheck,
} from '@phosphor-icons/react';

interface Props {
  slug: string;
  isActive: boolean;
}

export default function ActivateForm({ slug, isActive }: Props) {
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [reviewUrl, setReviewUrl] = useState('');
  const [pin, setPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handlePlaceSelect = (place: SelectedPlace) => {
    if (!isDirectGoogleReviewUrl(place.googleReviewUrl)) {
      setSelectedPlace(null);
      setReviewUrl('');
      setStatus('error');
      setMessage('Link ulasan belum ditemukan. Coba cari dengan nama bisnis dan kota yang lebih spesifik.');
      return;
    }

    setSelectedPlace(place);
    setReviewUrl(place.googleReviewUrl);
    setStatus('idle');
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlace) {
      setStatus('error');
      setMessage('Silakan cari dan pilih profil toko / bisnis Anda dari Google Maps terlebih dahulu.');
      return;
    }

    if (!isDirectGoogleReviewUrl(reviewUrl)) {
      setStatus('error');
      setMessage('Link ulasan tidak valid. Cari dan pilih kembali profil bisnis Anda.');
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      setStatus('error');
      setMessage('PIN Keamanan wajib terdiri dari tepat 6 digit angka.');
      return;
    }

    if (isActive && !/^\d{6}$/.test(currentPin)) {
      setStatus('error');
      setMessage('PIN lama wajib terdiri dari 6 digit angka.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch(`/api/activate/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: selectedPlace.name,
          location: selectedPlace.location,
          googleReviewUrl: reviewUrl.trim(),
          pin,
          currentPin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error ?? 'Terjadi kesalahan saat memproses data.');
        return;
      }

      setStatus('success');
      setMessage(
        isActive
          ? 'Kartu berhasil diperbarui! Link ulasan Google baru sudah aktif.'
          : 'Selamat! Kartu NFC TapFlow Anda telah aktif dan siap digunakan pelanggan.'
      );
    } catch {
      setStatus('error');
      setMessage('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    }
  };

  // SUCCESS SCREEN STATE
  if (status === 'success' && selectedPlace) {
    const directReviewUrl = `/c/${slug}`;

    return (
      <div className="text-center py-4 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle size={36} weight="fill" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {isActive ? 'Pengaturan Berhasil Disimpan!' : 'Kartu Berhasil Diaktifkan!'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {message}
          </p>
        </div>

        {/* Selected Store Summary */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Profil Google Maps Terhubung
          </p>
          <p className="font-bold text-sm text-slate-900 dark:text-white">
            {selectedPlace.name}
          </p>
          {selectedPlace.location && (
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1">
              <MapPin size={14} weight="fill" className="text-blue-500 shrink-0 mt-0.5" />
              <span>{selectedPlace.location}</span>
            </p>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <a
            href={directReviewUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/25"
          >
            <span>Uji Coba Buka Ulasan Google</span>
            <ArrowSquareOut size={16} weight="bold" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. FIELD 1: CARI PROFIL TOKO DI GOOGLE MAPS */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
          CARI PROFIL TOKO ANDA DI GOOGLE MAPS:
        </label>

        {!selectedPlace ? (
          <GoogleBusinessSearch
            onSelect={handlePlaceSelect}
            placeholder="Ketik nama toko, cafe, atau bisnis Anda..."
          />
        ) : (
          <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 flex items-start justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <MapPin size={18} weight="fill" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {selectedPlace.name}
                  </p>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full shrink-0">
                    ✓ Terhubung
                  </span>
                </div>
                {selectedPlace.location && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {selectedPlace.location}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedPlace(null);
                setReviewUrl('');
              }}
              className="shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 hover:bg-blue-50 transition-colors shadow-2xs"
            >
              <ArrowsClockwise size={13} weight="bold" />
              <span>Ganti</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. FIELD 2: 6-DIGIT PIN KEAMANAN */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        {isActive && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              PIN SAAT INI (6 DIGIT):
            </label>
            <input
              type="password"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              maxLength={6}
              inputMode="numeric"
              pattern="\d{6}"
              required={isActive}
              disabled={status === 'loading'}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center text-xl font-mono tracking-[0.4em] outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center justify-between">
            <span>{isActive ? 'PIN BARU (6 DIGIT):' : 'BUAT 6-DIGIT PIN KEAMANAN:'}</span>
            <span className="text-[11px] font-normal text-slate-400">6 Digit Angka</span>
          </label>
          <div className="relative">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              inputMode="numeric"
              pattern="\d{6}"
              required
              disabled={status === 'loading'}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center text-xl font-mono tracking-[0.4em] outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            Simpan PIN 6 digit ini. Diperlukan jika Anda ingin mengubah tautan toko di masa mendatang.
          </p>
        </div>
      </div>

      {/* Feedback Messages */}
      {message && (
        <div
          className={`rounded-2xl px-4 py-3 text-xs font-semibold flex items-center gap-2.5 ${
            status === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          {status === 'error' ? (
            <WarningCircle size={18} weight="fill" className="text-rose-600 shrink-0" />
          ) : (
            <CheckCircle size={18} weight="fill" className="text-emerald-600 shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}

      {/* Primary Submit Button */}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-[0.99]"
      >
        {status === 'loading' ? (
          <span>Memproses Aktivasi...</span>
        ) : isActive ? (
          <span>Simpan Perubahan Kartu</span>
        ) : (
          <span>Aktifkan Kartu Sekarang &rarr;</span>
        )}
      </button>

      {/* Security note */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck size={14} weight="fill" className="text-emerald-500" />
        <span>100% Terhubung Resmi ke Google Business Profile</span>
      </div>
    </form>
  );
}
