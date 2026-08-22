import { db } from '@/lib/db';
import { cards } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ActivateForm from './ActivateForm';
import { Lightning, ShieldCheck } from '@phosphor-icons/react/dist/ssr';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ActivatePage({ params }: Props) {
  const { slug } = await params;

  const card = await db.query.cards.findFirst({
    where: eq(cards.slug, slug),
    columns: {
      id: true,
      slug: true,
      status: true,
      businessName: true,
    },
  });

  if (!card) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans antialiased">
      <div className="w-full max-w-lg mx-auto my-auto py-6 sm:py-10">
        {/* Sleek Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Lightning size={18} weight="fill" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900">
              Tap<span className="text-blue-600">Flow</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {card.status === 'active' ? 'Pengaturan Kartu Ulasan' : 'Aktivasi Kartu Ulasan Google'}
          </h1>
          <p className="text-slate-500 mt-1.5 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
            Hubungkan kartu NFC ini ke profil Google Maps bisnis Anda.
          </p>

          <div className="mt-3">
            <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-md">
              Serial: <strong className="text-slate-800">{slug}</strong>
            </span>
          </div>
        </div>

        {/* Clean Onboarding Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xl shadow-slate-200/40">
          <ActivateForm slug={slug} isActive={card.status === 'active'} />
        </div>

        {/* Minimal Footer */}
        <div className="mt-8 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
            <ShieldCheck size={15} weight="fill" className="text-emerald-500" />
            <span>Keamanan PIN 6 Digit Terenkripsi</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            &copy; {new Date().getFullYear()} TapFlow &bull; Powered by InvictusWave
          </p>
        </div>
      </div>
    </main>
  );
}
