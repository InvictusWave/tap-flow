'use client';

import { useRouter } from 'next/navigation';
import { clearClientCache } from '@/lib/client-cache';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    clearClientCache();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="text-slate-400 hover:text-white text-sm transition-colors px-3 py-1 rounded-lg hover:bg-slate-700"
    >
      Logout
    </button>
  );
}
