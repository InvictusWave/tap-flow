# TapFlow

> Platform Google Review NFC & QR Card — Produk dari **InvictusWave**

TapFlow memungkinkan bisnis untuk dengan mudah mengumpulkan Google Review dari pelanggan melalui kartu NFC yang ditap atau QR Code yang discan. Sistem redirect dinamis berbasis Edge Runtime memastikan latency < 50ms.

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Turso (LibSQL) + Drizzle ORM |
| Cache | Upstash Redis |
| Runtime | Vercel Edge Runtime |
| Deploy | Vercel Free Tier |

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url> tap-flow
cd tap-flow
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env.local
# Edit .env.local dengan credentials yang benar
```

### 3. Setup Database (Turso)

```bash
# Install Turso CLI (jika belum)
curl -sSfL https://get.tur.so/install.sh | bash

# Login dan buat database
turso auth login
turso db create tapflow

# Dapatkan credentials
turso db show tapflow --url
turso db tokens create tapflow

# Push schema ke database
npm run db:push
```

### 4. Setup Redis (Upstash)

1. Buat akun di [upstash.com](https://upstash.com)
2. Buat database Redis baru
3. Salin REST URL dan REST Token ke `.env.local`

### 5. Run Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Routes

| Route | Deskripsi |
|-------|-----------|
| `/` | Landing page TapFlow |
| `/c/[slug]` | Redirect engine (Edge Runtime) |
| `/activate/[slug]` | Halaman aktivasi kartu |
| `/admin` | Dashboard admin (protected) |
| `/admin/login` | Login admin |

## API Routes

| Method | Route | Deskripsi |
|--------|-------|-----------|
| `POST` | `/api/activate/[slug]` | Aktivasi atau update kartu |
| `POST` | `/api/admin/auth` | Login admin |
| `DELETE` | `/api/admin/auth` | Logout admin |
| `GET` | `/api/admin/cards` | List kartu (paginated) |
| `POST` | `/api/admin/cards/bulk-generate` | Generate kartu massal |
| `GET` | `/api/admin/cards/[id]` | Detail kartu |
| `PATCH` | `/api/admin/cards/[id]` | Update kartu |
| `POST` | `/api/admin/cards/[id]/reset-pin` | Reset PIN kartu |
| `GET` | `/api/admin/cards/export` | Export CSV/JSON |

## Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables di Vercel Dashboard
# atau via CLI:
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env add ADMIN_PASSWORD
vercel env add SUPER_ADMIN_EMAIL
vercel env add ADMIN_SESSION_SECRET
vercel env add NEXT_PUBLIC_APP_URL
```

Jalankan `npm run db:push` satu kali setelah deploy untuk menambahkan tabel admin dan kolom pemilik kartu. Login awal memakai `SUPER_ADMIN_EMAIL` dan `SUPER_ADMIN_PASSWORD` (password akan fallback ke `ADMIN_PASSWORD`).

## Panduan NFC (NTAG213)

Saat menulis URL ke stiker NFC NTAG213, gunakan URL:
```
https://your-domain.vercel.app/c/[SLUG]
```

Contoh: `https://tapflow.vercel.app/c/ab3k9xmz`

## Struktur Database

Lihat [docs/system-design.md](docs/system-design.md) untuk dokumentasi lengkap.

---

*TapFlow © 2026 InvictusWave. All rights reserved.*
