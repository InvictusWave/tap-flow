# TapFlow — System Design

> **TapFlow** adalah produk dari **InvictusWave** — platform manajemen Google Review berbasis kartu NFC & QR Code dengan sistem redirect dinamis berperforma tinggi.

---

## 1. Overview Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (NFC / QR)                        │
│                   Tap/Scan → /c/[slug]                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP Request
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              VERCEL EDGE RUNTIME (< 50ms latency)               │
│                  Route: /app/c/[slug]/route.ts                  │
│                                                                 │
│  1. Lookup Redis key: card:[slug]                               │
│     ├── HIT  → HTTP 307 Redirect ke google_review_url           │
│     └── MISS → Query Turso DB                                   │
│                 ├── FOUND   → Cache ke Redis → 307 Redirect      │
│                 ├── INACTIVE → Redirect ke /activate/[slug]      │
│                 └── NOT FOUND → Response 404                     │
└───────────────────────────┬─────────────────────────────────────┘
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────┐   ┌──────────────────────────────────────┐
│   Upstash Redis      │   │         Turso (LibSQL)               │
│   Cache Layer        │   │         Primary Database             │
│   TTL: 24 jam        │   │                                      │
│   Key: card:[slug]   │   │   Table: cards                       │
│   Val: JSON URL      │   │   Table: card_scans                  │
└──────────────────────┘   └──────────────────────────────────────┘
```

---

## 2. Skema Database (Turso / LibSQL)

### Tabel `cards`

| Kolom               | Tipe        | Keterangan                                      |
|---------------------|-------------|--------------------------------------------------|
| `id`                | TEXT (UUID) | Primary key, auto-generated UUID                |
| `slug`              | TEXT        | Unique identifier 8 karakter, untuk URL /c/slug |
| `business_name`     | TEXT        | Nama bisnis pemilik kartu (nullable saat unassigned) |
| `google_review_url` | TEXT        | URL Google Review tujuan redirect (nullable)    |
| `pin_hash`          | TEXT        | bcrypt hash dari 6-digit PIN                    |
| `status`            | TEXT        | `unassigned` \| `active`                         |
| `total_scans`       | INTEGER     | Counter total scan/klik (default: 0)             |
| `created_at`        | INTEGER     | Unix timestamp saat kartu dibuat                |
| `updated_at`        | INTEGER     | Unix timestamp saat kartu terakhir diupdate      |

**DDL:**
```sql
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  business_name TEXT,
  google_review_url TEXT,
  pin_hash TEXT,
  status TEXT NOT NULL DEFAULT 'unassigned',
  total_scans INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cards_slug ON cards(slug);
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
```

### Tabel `card_scans`

| Kolom        | Tipe        | Keterangan                                   |
|--------------|-------------|----------------------------------------------|
| `id`         | TEXT (UUID) | Primary key                                  |
| `card_id`    | TEXT        | Foreign key ke `cards.id`                    |
| `scanned_at` | INTEGER     | Unix timestamp saat scan terjadi             |
| `user_agent` | TEXT        | User-Agent browser/device (optional logging) |

**DDL:**
```sql
CREATE TABLE IF NOT EXISTS card_scans (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id),
  scanned_at INTEGER NOT NULL,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_card_scans_card_id ON card_scans(card_id);
```

---

## 3. Redis Caching Strategy

### Key Format
```
card:[slug]
```

### Value Format (JSON string)
```json
{
  "google_review_url": "https://g.page/r/xxxxxx/review",
  "business_name": "Nama Toko ABC",
  "card_id": "uuid-string"
}
```

### TTL
- Default: **86400 detik (24 jam)**
- Di-refresh (reset TTL) setiap kali ada hit dari redirect engine.
- Di-invalidate secara eksplisit saat owner melakukan update URL melalui `/activate/[slug]`.

### Flow Cache
```
Request → Redis GET card:[slug]
  ├── HIT  → Parse JSON → Redirect → Redis EXPIRE card:[slug] 86400
  └── MISS → Turso SELECT * FROM cards WHERE slug = ?
               ├── status = 'active'   → Redis SET card:[slug] JSON EX 86400 → Redirect
               ├── status = 'unassigned' → Redirect ke /activate/[slug]
               └── rows = 0             → Response 404
```

---

## 4. Redirect Flow Detail

```
User (NFC Tap / QR Scan)
    │
    ▼
GET /c/[slug]  [Edge Runtime]
    │
    ├─ Redis HIT ──────────────────────────────────────────► 307 → google_review_url
    │                                                           + increment scan counter (async)
    │
    └─ Redis MISS
          │
          ▼
         Turso Query: SELECT * FROM cards WHERE slug = :slug LIMIT 1
          │
          ├─ status = 'active' ─────────────────────────────► Cache ke Redis
          │                                                    307 → google_review_url
          │                                                    + increment scan counter (async)
          │
          ├─ status = 'unassigned' ─────────────────────────► 307 → /activate/[slug]
          │
          └─ NOT FOUND ─────────────────────────────────────► 404 Response
```

---

## 5. Aktivasi & Update Flow

```
Owner (Pemilik Toko)
    │
    ▼
GET /activate/[slug]
    │
    └─ Tampilkan form:
         ├─ status = 'unassigned' → Form aktivasi (Nama Bisnis + Google URL + PIN baru)
         └─ status = 'active'     → Form update (input PIN lama + field baru)

POST /activate/[slug]
    │
    ├─ status = 'unassigned' → Simpan data, hash PIN, set status = 'active'
    │                         Redirect ke success page
    │
    └─ status = 'active' → Validasi PIN hash
                            ├─ VALID   → Update Turso → Invalidate Redis → Success
                            └─ INVALID → Return error "PIN salah"
```

---

## 6. Admin Dashboard Flow

```
GET /admin
    │
    └─ Cek session cookie atau Authorization header
         ├─ VALID   → Tampilkan dashboard
         └─ INVALID → Redirect ke /admin/login

Admin Features:
    ├─ Bulk Generator  → POST /api/admin/cards/bulk-generate
    │                    Body: { count: 50 }
    │                    Response: array of { slug, qr_url }
    │
    ├─ Card Management → GET /api/admin/cards?page=1&status=all
    │                    Response: paginated card list
    │
    ├─ Reset PIN       → POST /api/admin/cards/[id]/reset-pin
    │                    Clears pin_hash, sets status = 'unassigned'
    │                    Invalidates Redis cache
    │
    └─ Export / Print  → GET /api/admin/cards/export?format=pdf|csv
                         Returns printable QR codes or CSV
```

---

## 7. Environment Variables

```env
# Turso
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Admin
ADMIN_PASSWORD=your-secure-admin-password

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

## 8. Tech Stack Summary

| Layer       | Teknologi                    | Alasan                                      |
|-------------|------------------------------|----------------------------------------------|
| Framework   | Next.js 15 (App Router)      | SSR, Edge Runtime, file-based routing        |
| Language    | TypeScript                   | Type safety, maintainability                 |
| Styling     | Tailwind CSS                 | Utility-first, no runtime overhead           |
| Primary DB  | Turso (LibSQL)               | SQLite-compatible, serverless-friendly       |
| ORM         | Drizzle ORM                  | Lightweight, type-safe, edge-compatible      |
| Cache       | Upstash Redis                | Serverless Redis, HTTP-based, edge-compatible|
| Runtime     | Vercel Edge (redirect route) | Latency < 50ms, global CDN                  |
| Hosting     | Vercel Free Tier             | Auto-scaling, zero config deploy             |
| QR Library  | qrcode (npm)                 | Server-side QR code generation               |

---

## 9. Directory Structure

```
tap-flow/
├── app/
│   ├── c/[slug]/
│   │   └── route.ts            # Edge Runtime redirect engine
│   ├── activate/[slug]/
│   │   └── page.tsx            # Halaman aktivasi kartu
│   ├── admin/
│   │   ├── page.tsx            # Dashboard utama
│   │   ├── login/page.tsx      # Login admin
│   │   └── layout.tsx          # Layout admin dengan auth check
│   ├── api/
│   │   └── admin/
│   │       └── cards/
│   │           ├── route.ts              # GET all cards (paginated)
│   │           ├── bulk-generate/
│   │           │   └── route.ts          # POST bulk generate cards
│   │           ├── [id]/
│   │           │   ├── route.ts          # GET/PATCH single card
│   │           │   └── reset-pin/
│   │           │       └── route.ts      # POST reset PIN
│   │           └── export/
│   │               └── route.ts          # GET export CSV
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page TapFlow
├── lib/
│   ├── db.ts                   # Turso client & Drizzle setup
│   ├── redis.ts                # Upstash Redis client
│   ├── schema.ts               # Drizzle schema definitions
│   └── utils.ts                # Helper functions (slug gen, PIN hash)
├── components/
│   ├── admin/
│   │   ├── CardTable.tsx
│   │   ├── BulkGenerator.tsx
│   │   └── QRExport.tsx
│   └── ui/
│       └── (shared components)
├── docs/
│   └── system-design.md        # (file ini)
├── drizzle.config.ts           # Drizzle Kit config
├── .env.local                  # Environment variables (gitignored)
└── .env.example                # Template env variables
```

---

*Dokumen ini dikelola oleh tim engineering InvictusWave. Last updated: 2026-08-21.*
