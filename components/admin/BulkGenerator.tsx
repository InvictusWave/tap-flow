'use client';

import { useState } from 'react';

interface GeneratedCard {
  slug: string;
  url: string;
  activateUrl: string;
}

export default function BulkGenerator() {
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedCard[] | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/admin/cards/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Gagal generate kartu.');
        return;
      }

      setResult(data.cards);
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!result) return;
    const headers = ['Slug', 'Redirect URL', 'Activate URL'];
    const rows = result.map((c) => [c.slug, c.url, c.activateUrl]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tapflow-new-cards-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Bulk Generator Kartu</h2>

      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Jumlah Kartu
          </label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Math.min(200, Math.max(1, parseInt(e.target.value) || 1)))}
            min={1}
            max={200}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-slate-500 text-xs mt-1">Maksimal 200 kartu per batch</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-semibold rounded-lg px-6 py-2.5 text-sm transition-colors whitespace-nowrap"
        >
          {loading ? 'Generating...' : `Generate ${count} Kartu`}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-green-400 text-sm font-medium">
              ✓ Berhasil generate {result.length} kartu baru
            </p>
            <button
              onClick={handleDownloadCsv}
              className="text-slate-300 hover:text-white text-xs border border-slate-600 hover:border-slate-500 rounded-lg px-3 py-1.5 transition-colors"
            >
              Download CSV
            </button>
          </div>
          <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-800 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-slate-400 font-medium">Slug</th>
                  <th className="text-left px-3 py-2 text-slate-400 font-medium">Redirect URL</th>
                </tr>
              </thead>
              <tbody>
                {result.map((card, i) => (
                  <tr key={card.slug} className={i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/50'}>
                    <td className="px-3 py-2 text-blue-400 font-mono">{card.slug}</td>
                    <td className="px-3 py-2 text-slate-300">{card.url}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
