# 🎬 Discord Movie Assistant & Legal Streaming Discovery Bot

Sebuah aplikasi Discord Bot profesional dan *production-ready* yang dibangun dengan **Node.js**, **TypeScript**, **discord.js v14**, **Prisma ORM**, **PostgreSQL**, dan **The Movie Database (TMDB) API** untuk mencari informasi film, menemukan tempat menonton di platform streaming resmi/legal, menonton trailer resmi, serta mengelola favorit dan watchlist.

> [!IMPORTANT]
> **Zero Piracy Policy**: Bot ini **TIDAK** membypass DRM, tidak mengambil atau mendistribusikan stream video ilegal, tidak membypass paywall, dan hanya mengarahkan pengguna ke platform streaming resmi (Netflix, Disney+, Prime Video, Apple TV, Vidio, YouTube Movies, Google Play Movies, dll.) via Discord Link Buttons.

---

## 🌟 Fitur Utama

- **Pencarian Film Cepat**: `/movie <judul>` dengan fitur **Discord Autocomplete** instan.
- **Deteksi Link Streaming Resmi**: `/watch <url>` memvalidasi dan mengenali platform resmi serta membuka halaman tonton legal.
- **Informasi Lengkap**: Rating, tahun rilis, durasi, genre, sinopsis, daftar aktor (*cast*), dan sutradara (*director*).
- **Ketersediaan Streaming Legal**: Integrasi data JustWatch via TMDB Watch Providers untuk menampilkan platform resmi di wilayah pengguna.
- **Trailer Resmi YouTube**: Tombol link langsung memutar trailer resmi dari studio/distributor.
- **Sistem Favorit & Watchlist**: Simpan dan kelola film impian di database PostgreSQL.
- **Fitur Discovery**:
  - `/trending` — Film terpopuler hari ini
  - `/top` — Film dengan rating tertinggi sepanjang masa
  - `/random` — Rekomendasi film acak
  - `/genre <nama>` — Filter berdasarkan genre
  - `/year <tahun>` — Filter berdasarkan tahun rilis
  - `/actor <nama>` — Film yang dibintangi aktor tertentu
  - `/director <nama>` — Film karya sutradara tertentu
  - `/recommend <film>` — Rekomendasi film serupa
- **Keamanan & Performa**:
  - **SSRF Protection**: Blokir private network, IP lokal, dan domain non-whitelist.
  - **Rate Limiting**: Sliding window rate limiter (10 request/menit per user).
  - **Multi-level Caching**: Redis Cache dengan fallback otomatis ke In-Memory cache ber-TTL.
  - **Structured Logging**: Logging terstruktur via Pino dengan penyaringan data sensitif (*redaction*).
  - **Multi-Language (i18n)**: Bahasa Indonesia (Default) & English.

---

## 📁 Struktur Folder Proyek

```
DISCORD V4/
├── .env.example                      # Template environment variables
├── Dockerfile                        # Multi-stage production container
├── docker-compose.yml                # Docker Compose (Bot + Postgres + Redis)
├── package.json                      # Dependencies & NPM scripts
├── tsconfig.json                     # TypeScript configuration
├── vitest.config.ts                  # Test configuration
├── prisma/
│   └── schema.prisma                 # Database models (User, Favorite, Watchlist, History)
├── src/
│   ├── index.ts                      # Bot entry point & lifecycle
│   ├── deploy-commands.ts            # Slash commands registration script
│   ├── config/
│   │   ├── env.config.ts             # Zod environment validation
│   │   └── constants.ts              # Emojis, colors & TTLs
│   ├── database/
│   │   └── prisma.ts                 # Prisma Client singleton
│   ├── types/
│   │   ├── movie.types.ts            # Domain entity definitions
│   │   ├── command.types.ts          # SlashCommand interfaces
│   │   └── config.types.ts
│   ├── utils/
│   │   ├── logger.ts                 # Pino structured logger
│   │   ├── embed.builder.ts          # Modern Discord Embed builders
│   │   ├── button.builder.ts         # Action & Link button helpers
│   │   ├── pagination.ts             # Interactive pagination helper
│   │   ├── formatters.ts             # Runtime, rating & text helpers
│   │   └── ssrf.validator.ts         # SSRF & IP security validator
│   ├── locales/
│   │   ├── i18n.ts                   # Internationalization engine
│   │   ├── id.json                   # Bahasa Indonesia (Default)
│   │   └── en.json                   # English
│   ├── middleware/
│   │   ├── rate-limiter.ts           # Sliding window rate limiter
│   │   └── admin.guard.ts            # Admin permission authorization
│   ├── services/
│   │   ├── cache.service.ts          # Redis + In-Memory fallback cache
│   │   ├── movie.service.ts          # Movie discovery orchestrator
│   │   ├── user.service.ts           # User preferences & history service
│   │   └── stats.service.ts          # Analytics & runtime metrics
│   ├── providers/
│   │   ├── base.provider.ts          # MovieProvider interface
│   │   ├── provider-manager.ts       # Orchestrator & URL resolver
│   │   ├── tmdb.provider.ts          # TMDB v3 API implementation
│   │   ├── youtube.provider.ts       # YouTube trailer lookup
│   │   └── platform-detector.ts      # Whitelisted streaming domain parser
│   ├── events/
│   │   ├── ready.ts                  # Discord client ready event
│   │   ├── interactionCreate.ts      # Command, autocomplete & button router
│   │   └── error.ts                  # Global client error handler
│   ├── buttons/                      # Interactive button action handlers
│   │   ├── favorite.button.ts
│   │   ├── watchlist.button.ts
│   │   └── watch-info.button.ts
│   └── commands/                     # Slash command implementations
│       ├── movie/                    # /movie, /search, /watch, /info, /trailer, /platform
│       ├── discovery/                # /random, /trending, /top, /genre, /year, /actor, /director, /recommend
│       ├── user/                     # /favorite, /favorites, /watchlist, /history
│       ├── general/                  # /help, /ping, /stats
│       └── admin/                    # /admin
└── tests/                            # Vitest unit test suite
    ├── ssrf-validator.test.ts
    ├── platform-detector.test.ts
    ├── rate-limiter.test.ts
    ├── tmdb-provider.test.ts
    └── movie-service.test.ts
```

---

## 🚀 Panduan Instalasi & Menjalankan

### Prasyarat
1. **Node.js v20+**
2. **PostgreSQL** (atau via Docker Compose)
3. **Redis** *(Opsional, bot memiliki in-memory fallback otomatis)*
4. **Discord Bot Token & Client ID** (dari [Discord Developer Portal](https://discord.com/developers/applications))
5. **TMDB API Key v3** (dari [TheMovieDB Settings](https://www.themoviedb.org/settings/api))

---

### Cara 1: Menggunakan Docker Compose (Sangat Direkomendasikan)

1. Buat file `.env` dari `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Buka `.env` dan masukkan API keys Anda:
   ```env
   DISCORD_TOKEN=your_token
   DISCORD_CLIENT_ID=your_client_id
   TMDB_API_KEY=your_tmdb_api_key
   ```
3. Daftarkan Slash Commands ke Discord:
   ```bash
   npm install
   npm run deploy:commands
   ```
4. Jalankan seluruh layanan (Bot, PostgreSQL, Redis) dengan Docker:
   ```bash
   docker compose up -d --build
   ```
5. Lihat log bot:
   ```bash
   docker compose logs -f discord-bot
   ```

---

### Cara 2: Deployment ke Railway (railway.com / railway.app) 🚂

Project ini **100% siap langsung dideploy di Railway**:

1. **Push source code ke GitHub** repository Anda.
2. Buka **[Railway Dashboard](https://railway.com/)** dan klik **+ New Project** → **Deploy from GitHub repo**.
3. Pilih repository Discord Bot Anda.
4. Di canvas Railway, tambahkan Database:
   - Klik **+ Create** → **Database** → **Add PostgreSQL**.
   - *(Opsional)* Klik **+ Create** → **Database** → **Add Redis**.
5. Buka tab **Variables** pada service Bot Anda dan tambahkan:
   - `DISCORD_TOKEN` = `token_bot_anda`
   - `DISCORD_CLIENT_ID` = `client_id_anda`
   - `TMDB_API_KEY` = `api_key_tmdb_anda`
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` *(Railway otomatis menghubungkan database)*
   - `REDIS_URL` = `${{Redis.REDIS_URL}}` *(Jika menggunakan Redis)*
6. Bot akan otomatis melakukan build via `Dockerfile`, sync schema Prisma via `prisma db push`, dan langsung aktif 24/7!

---

### Cara 3: Menjalankan Secara Manual (Development)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Konfigurasi Environment**:
   Salin `.env.example` ke `.env`:
   ```env
   DISCORD_TOKEN=your_discord_bot_token
   DISCORD_CLIENT_ID=your_client_id
   DISCORD_GUILD_ID=your_test_server_id   # Opsional untuk update instan di server dev
   TMDB_API_KEY=your_tmdb_api_key
   DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/discord_movie_bot?schema=public"
   ```

3. **Generate & Migrasi Database**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Daftarkan Slash Commands**:
   ```bash
   npm run deploy:commands
   ```

5. **Jalankan Bot**:
   ```bash
   npm run dev
   ```

---

## 🧪 Menjalankan Pengujian (Testing)

Proyek ini dilengkapi dengan unit test Vitest lengkap:
```bash
npm test
```

---

## 📜 Daftar Slash Commands

| Perintah | Deskripsi |
| :--- | :--- |
| `/movie <judul>` | Tampilkan info lengkap film, poster, rating, cast, dan tombol aksi |
| `/search <nama>` | Cari hingga 10 film dan pilih nomor untuk melihat detailnya |
| `/watch <judul/url>` | Tonton film atau deteksi link streaming resmi dari URL |
| `/info <judul>` | Detail informasi spesifikasi dan sinopsis film |
| `/trailer <judul>` | Tonton trailer resmi film di YouTube |
| `/platform <judul>` | Tampilkan platform streaming legal tempat film tersedia |
| `/trending` | Daftar film yang sedang tren hari ini |
| `/top` | Daftar film dengan rating tertinggi sepanjang masa |
| `/random` | Dapatkan rekomendasi 1 film acak berkualitas |
| `/genre <nama>` | Cari film berdasarkan genre (Action, Sci-Fi, Horror, dll.) |
| `/year <tahun>` | Cari film populer berdasarkan tahun rilis |
| `/actor <nama>` | Cari film yang dibintangi aktor tertentu |
| `/director <nama>` | Cari film yang disutradarai sutradara tertentu |
| `/recommend <film>` | Dapatkan rekomendasi film yang serupa |
| `/favorite add <judul>` | Tambahkan film ke daftar favorit |
| `/favorite remove <judul>` | Hapus film dari favorit |
| `/favorites` | Tampilkan seluruh koleksi film favorit kamu |
| `/watchlist add <judul>` | Tambahkan film ke Watchlist |
| `/watchlist list` | Tampilkan isi Watchlist kamu |
| `/watchlist remove <judul>`| Hapus film dari Watchlist |
| `/history` | Tampilkan riwayat pencarian (disertai tombol pembersih) |
| `/ping` | Cek latensi bot dan WebSocket |
| `/stats` | Statistik penggunaan bot dan konsumsi memori |
| `/help` | Tampilkan panduan penggunaan bot |
| `/admin stats` | Dashboard statistik database dan bot (Admin Only) |
| `/admin cache-clear` | Bersihkan seluruh cache (Admin Only) |
| `/admin providers` | Periksa kesehatan Movie Provider (Admin Only) |
| `/admin broadcast <pesan>` | Kirim pengumuman ke seluruh server (Admin Only) |

---

## 🛡️ Keamanan & Kepatuhan

1. **Anti-Piracy**: Tidak mendukung scraping situs ilegal, tidak membypass DRM, tidak membagikan file copyright secara tidak sah.
2. **SSRF Guard**: URL yang dimasukkan user melalui `/watch` dicek ketat untuk memblokir IP internal (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254`, `localhost`, private IPv6).
3. **Domain Whitelist**: Hanya tautan domain streaming legal (seperti `netflix.com`, `primevideo.com`, `disneyplus.com`, `tv.apple.com`, `youtube.com`, `vidio.com`, dll.) yang diproses.
4. **Data Sanitization**: Log sistem menyaring token Discord dan API key agar tidak bocor di terminal atau error logs.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).
