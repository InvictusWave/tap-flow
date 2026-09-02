'use client';

import { useEffect, useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';

interface AdminRow {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin';
  active: boolean;
  expiresAt: number | null;
  expired: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminRow[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', validityDays: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    const response = await fetch('/api/admin/users');
    if (response.ok) setUsers((await response.json()).users);
  }

  useEffect(() => {
    fetch('/api/admin/users')
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data) setUsers(data.users); });
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error || 'Gagal menambahkan admin.');
      return;
    }

    setForm({ name: '', email: '', password: '', validityDays: '' });
    setMessage('Admin berhasil ditambahkan.');
    await loadUsers();
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Manajemen Admin"
        subtitle="Super admin dapat menambahkan admin yang hanya mengelola kartu miliknya sendiri."
      />

      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nama admin"
          required
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
        />
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email admin"
          required
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
        />
        <input
          type="password"
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Password minimal 8 karakter"
          required
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={1}
          max={3650}
          value={form.validityDays}
          onChange={(e) => setForm({ ...form, validityDays: e.target.value })}
          placeholder="Berlaku (hari), opsional"
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
        />
        <button disabled={loading} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? 'Menyimpan...' : 'Tambah Admin'}
        </button>
        {message && <p className="text-xs text-slate-500 md:col-span-4">{message}</p>}
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Berlaku Sampai</th><th className="px-4 py-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-slate-500">{user.email}</td>
                <td className="px-4 py-3">{user.role === 'super_admin' ? 'Super Admin' : 'Admin'}</td>
                <td className="px-4 py-3 text-slate-500">
                  {user.expiresAt ? new Date(user.expiresAt * 1000).toLocaleString('id-ID') : 'Tanpa batas'}
                </td>
                <td className="px-4 py-3">
                  {!user.active ? 'Nonaktif' : user.expired ? 'Kedaluwarsa' : 'Aktif'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
