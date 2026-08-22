export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/20 rounded-3xl mb-6">
          <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold text-white mb-3">
          Tap<span className="text-blue-400">Flow</span>
        </h1>
        <p className="text-slate-400 text-lg mb-2">
          Platform Google Review NFC & QR Card
        </p>
        <p className="text-slate-500 text-sm mb-8">
          by <span className="text-slate-400 font-medium">InvictusWave</span>
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            {
              icon: '⚡',
              title: 'Ultra Cepat',
              desc: 'Redirect < 50ms dengan Edge Runtime + Redis Cache',
            },
            {
              icon: '🔗',
              title: 'Dynamic Link',
              desc: 'Ubah URL Google Review kapan saja tanpa ganti kartu',
            },
            {
              icon: '📊',
              title: 'Track Scan',
              desc: 'Monitor total tap & scan kartu NFC dan QR Code',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-left"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="text-white font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-slate-400 text-xs">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <a
          href="/admin"
          className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl px-8 py-3 transition-colors"
        >
          Masuk ke Admin Dashboard
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>

        <p className="text-slate-600 text-xs mt-8">
          TapFlow &copy; {new Date().getFullYear()} InvictusWave. All rights reserved.
        </p>
      </div>
    </main>
  );
}
