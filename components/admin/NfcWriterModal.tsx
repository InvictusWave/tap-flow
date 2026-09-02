'use client';

import React, { useState } from 'react';
import {
  X,
  Broadcast,
  Copy,
  Check,
  ArrowSquareOut,
  DeviceMobile,
  WarningCircle,
  CheckCircle,
  Lightning,
  Sparkle,
} from '@phosphor-icons/react';

interface Card {
  id: string;
  slug: string;
  businessName: string | null;
  location: string | null;
  status: 'active' | 'unassigned';
  googleReviewUrl: string | null;
}

interface NfcWriterModalProps {
  card: Card;
  appUrl: string;
  onClose: () => void;
}

export default function NfcWriterModal({ card, appUrl, onClose }: NfcWriterModalProps) {
  const [copiedActivate, setCopiedActivate] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [nfcStatus, setNfcStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [nfcMessage, setNfcMessage] = useState<string>('');
  const nfcSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

  const activateUrl = `${appUrl}/activate/${card.slug}`;
  const directUrl = `${appUrl}/c/${card.slug}`;

  // Copy helpers
  const handleCopy = (text: string, type: 'activate' | 'direct') => {
    navigator.clipboard.writeText(text);
    if (type === 'activate') {
      setCopiedActivate(true);
      setTimeout(() => setCopiedActivate(false), 2500);
    } else {
      setCopiedDirect(true);
      setTimeout(() => setCopiedDirect(false), 2500);
    }
  };

  // Web NFC Write handler
  const handleWriteNfc = async (urlToWrite: string, targetType: 'activate' | 'direct') => {
    if (!('NDEFReader' in window)) {
      setNfcStatus('error');
      setNfcMessage('Web NFC API tidak didukung pada browser ini. Gunakan Chrome di Android.');
      return;
    }

    try {
      setNfcStatus('scanning');
      setNfcMessage('Dekatkan tag NFC atau kartu ke bagian belakang perangkat Anda sekarang...');

      const NDEFReaderClass = (window as typeof window & { NDEFReader: new () => { write: (payload: unknown) => Promise<void> } }).NDEFReader;
      const ndef = new NDEFReaderClass();

      // Write NDEF record with URL type
      await ndef.write({
        records: [
          {
            recordType: 'url',
            data: urlToWrite,
          },
        ],
      });

      setNfcStatus('success');
      setNfcMessage(
        `Sukses! Link ${targetType === 'activate' ? 'Aktivasi' : 'Direct Review'} berhasil diprogram ke tag NFC.`
      );
    } catch (err: unknown) {
      console.error('NFC Write Error:', err);
      setNfcStatus('error');
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setNfcMessage('Izin akses NFC ditolak atau dinonaktifkan di pengaturan browser.');
      } else if (err instanceof DOMException && err.name === 'NotSupportedError') {
        setNfcMessage('Perangkat ini tidak memiliki sensor hardware NFC.');
      } else {
        setNfcMessage(err instanceof Error ? err.message : 'Gagal menulis ke tag NFC. Pastikan tag tidak terkunci.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex overflow-y-auto bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="m-auto flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Broadcast size={22} weight="duotone" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Program NFC & Link Kartu
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kode Kartu: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{card.slug}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Card Info Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                {card.businessName || 'Belum Terdaftar Nama Bisnis'}
              </p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                {card.location || 'Semua Lokasi / Cabang'}
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full font-bold text-[11px] shrink-0 ${
                card.status === 'active'
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}
            >
              {card.status === 'active' ? 'Sudah Aktif' : 'Belum Aktif'}
            </span>
          </div>

          {/* 1. LINK AKTIVASI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkle size={15} weight="duotone" className="text-indigo-500" />
                <span>Link Aktivasi Kartu</span>
              </label>
              <span className="text-[10px] text-slate-400">Untuk setup awal & hubungkan PIN</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={activateUrl}
                className="min-w-0 flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none select-all truncate"
              />
              <button
                type="button"
                onClick={() => handleCopy(activateUrl, 'activate')}
                className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                  copiedActivate
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copiedActivate ? (
                  <>
                    <Check size={15} weight="bold" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} weight="bold" />
                    <span>Salin URL</span>
                  </>
                )}
              </button>
              <a
                href={activateUrl}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="Buka Halaman Aktivasi"
              >
                <ArrowSquareOut size={16} weight="bold" />
              </a>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              💡 Masukkan URL ini ke tag NFC kartu jika Anda ingin klien pertama kali mengaktivasi sendiri kartu mereka.
            </p>
          </div>

          {/* 2. LINK LANGSUNG REVIEW (DIRECT TAP URL) */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Lightning size={15} weight="duotone" className="text-amber-500" />
                <span>Link Langsung Ulasan (Direct Tap URL)</span>
              </label>
              <span className="text-[10px] text-slate-400">Langsung ke modal 5-bintang</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={directUrl}
                className="min-w-0 flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none select-all truncate"
              />
              <button
                type="button"
                onClick={() => handleCopy(directUrl, 'direct')}
                className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                  copiedDirect
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white'
                }`}
              >
                {copiedDirect ? (
                  <>
                    <Check size={15} weight="bold" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} weight="bold" />
                    <span>Salin URL</span>
                  </>
                )}
              </button>
              <a
                href={directUrl}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="Coba Direct Link"
              >
                <ArrowSquareOut size={16} weight="bold" />
              </a>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              💡 Gunakan URL ini untuk kartu yang sudah aktif atau jika ingin langsung membuka form ulasan pelanggan.
            </p>
          </div>

          {/* 3. HARDWARE NFC WRITER (WEB NFC) */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <DeviceMobile size={15} weight="duotone" className="text-blue-500" />
                <span>Tulis Langsung ke Chip NFC (Web NFC)</span>
              </span>
              {nfcSupported ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  NFC Aktif
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Tidak Didukung di Browser Ini
                </span>
              )}
            </div>

            {nfcSupported ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleWriteNfc(activateUrl, 'activate')}
                    disabled={nfcStatus === 'scanning'}
                    className="p-3 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 text-left transition-colors flex flex-col justify-between group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between w-full">
                      <Broadcast size={20} weight="duotone" className="text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold bg-indigo-200/70 dark:bg-indigo-800/60 px-1.5 py-0.5 rounded">
                        Link Aktivasi
                      </span>
                    </div>
                    <span className="text-xs font-bold mt-2">Tulis Link Aktivasi ke Tag</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWriteNfc(directUrl, 'direct')}
                    disabled={nfcStatus === 'scanning'}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-900 dark:text-white text-left transition-colors flex flex-col justify-between group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between w-full">
                      <Lightning size={20} weight="duotone" className="text-amber-500 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                        Direct Review
                      </span>
                    </div>
                    <span className="text-xs font-bold mt-2">Tulis Direct Link ke Tag</span>
                  </button>
                </div>

                {/* NFC Status Banner */}
                {nfcStatus === 'scanning' && (
                  <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 animate-spin">
                      <Broadcast size={18} weight="bold" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                        Menunggu Kartu / Tag NFC...
                      </p>
                      <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                        {nfcMessage}
                      </p>
                    </div>
                  </div>
                )}

                {nfcStatus === 'success' && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                    <CheckCircle size={24} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        {nfcMessage}
                      </p>
                    </div>
                  </div>
                )}

                {nfcStatus === 'error' && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3">
                    <WarningCircle size={24} weight="fill" className="text-rose-600 dark:text-rose-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                        {nfcMessage}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <DeviceMobile size={14} weight="duotone" className="text-blue-500" />
                  <span>Cara Memprogram Chip NFC di Perangkat Ini:</span>
                </p>
                <p>
                  1. Klik tombol <strong>&quot;Salin URL&quot;</strong> di atas.
                </p>
                <p>
                  2. Buka aplikasi penulis NFC di HP Anda (seperti <em>NFC Tools</em> atau <em>NFC TagWriter</em> by NXP).
                </p>
                <p>
                  3. Pilih menu <strong>Write / Tulis URL</strong>, tempelkan link yang disalin, lalu dekatkan kartu NFC Anda.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
