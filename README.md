# Money Management API

Money Management adalah aplikasi backend (API) untuk manajemen keuangan yang dibangun menggunakan runtime [Bun](https://bun.com/) yang super cepat, framework [ElysiaJS](https://elysiajs.com/), dan [Drizzle ORM](https://orm.drizzle.team/).

## Technology Stack

- **Runtime**: [Bun](https://bun.com/)
- **Framework**: [ElysiaJS](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: MySQL (diakses via `mysql2`)
- **Language**: TypeScript

### Library Utama
- `elysia`: Web framework inti yang super cepat.
- `@elysiajs/cors`: Middleware untuk menangani *Cross-Origin Resource Sharing* (CORS).
- `@elysiajs/swagger`: Menghasilkan Swagger UI documentation secara otomatis berdasarkan validasi schema.
- `drizzle-orm` & `drizzle-kit`: Toolkit ORM modern untuk interaksi dan migrasi database MySQL.
- `bun:test`: *Test runner* bawaan Bun yang cepat untuk pengujian API.

## Arsitektur & Struktur Direktori

Aplikasi ini menggunakan pola arsitektur *layered* yang memisahkan definisi route, business logic, dan akses data. Pendekatan ini membuat kode lebih modular, mudah dikembangkan, dan ramah terhadap pengujian (*testing-friendly*).

```text
.
├── src/
│   ├── app.ts            # Definisi utama aplikasi Elysia (dipisah dari listener HTTP untuk pengujian)
│   ├── index.ts          # Entry point aplikasi (menjalankan app.listen)
│   ├── db/               # Konfigurasi Database
│   │   ├── index.ts      # Inisialisasi koneksi MySQL pool dan Drizzle instance
│   │   └── schema.ts     # Definisi schema tabel-tabel database
│   ├── routes/           # Layer API / Routing
│   │   └── user-route.ts # Route controller untuk endpoint user (Registrasi, Login, dll)
│   └── services/         # Layer Business Logic
│       └── users-service.ts # Menangani logika fitur pengguna (Hashing password, validasi, query)
├── tests/                # Folder Integration & Unit Test
│   └── api.test.ts       # Script pengujian integrasi menggunakan bun test
├── drizzle/              # Folder penyimpanan status migrasi dari Drizzle Kit
├── .env                  # Environment Variables (Database URL, konfigurasi port)
├── drizzle.config.ts     # Konfigurasi utama Drizzle Kit
├── package.json          # Dependency management & NPM scripts
└── tsconfig.json         # Konfigurasi compiler TypeScript
```

## Daftar API (Endpoints)

Aplikasi memiliki endpoint berbasis REST untuk fitur Autentikasi dan Manajemen Pengguna. Anda juga dapat mengakses **Swagger UI** interaktif di `http://localhost:<PORT>/swagger` ketika aplikasi berjalan.

| Method | Endpoint | Deskripsi | Autentikasi |
|--------|----------|-----------|-------------|
| `GET`  | `/` | Health check aplikasi (menampilkan status & uptime runtime Bun). | - |
| `POST` | `/users/register` | Mendaftarkan pengguna baru. Menerima payload JSON: `name`, `email`, dan `password`. | - |
| `POST` | `/api/users/login` | Melakukan proses autentikasi (Login). Jika sukses, mengembalikan `token` UUID sesi. | - |
| `GET`  | `/api/users/current`| Mengambil detail profil dari pengguna yang saat ini login. | Ya (`Bearer Token`) |
| `DELETE`| `/api/users/logout` | Melakukan proses logout dan menghapus kredensial token dari database. | Ya (`Bearer Token`) |

## Database Schema

Terdapat 4 tabel utama yang dikelola melalui Drizzle ORM:

1. **`users`**
   - `id` (INT, Primary Key, Auto Increment)
   - `name` (VARCHAR 255)
   - `email` (VARCHAR 255, Unique)
   - `password` (VARCHAR 255) - Password aman menggunakan *hash* bcrypt.
   - `createdAt` (TIMESTAMP)
   - `updatedAt` (TIMESTAMP)

2. **`sessions`** (Menangani sesi login pengguna)
   - `id` (INT, Primary Key, Auto Increment)
   - `token` (VARCHAR 255) - Token UUID otorisasi unik untuk pengguna yang sedang aktif.
   - `userId` (INT, Foreign Key ke `users.id`)
   - `createdAt` (TIMESTAMP)

3. **`categories`** (Kategori Transaksi)
   - `id` (INT, Primary Key, Auto Increment)
   - `name` (VARCHAR 255)
   - `type` (ENUM: `income`, `expense`) - Menentukan apakah kategori untuk pemasukan/pengeluaran.
   - `createdAt` (TIMESTAMP)

4. **`transactions`** (Pencatatan Keuangan)
   - `id` (INT, Primary Key, Auto Increment)
   - `userId` (INT, Foreign Key ke `users.id`)
   - `categoryId` (INT, Foreign Key ke `categories.id`)
   - `amount` (DECIMAL 15,2) - Nilai / nominal transaksi keuangan.
   - `description` (TEXT)
   - `date` (TIMESTAMP)
   - `createdAt` (TIMESTAMP)

## Cara Setup Project

Ikuti langkah-langkah berikut untuk memulai environment *local development*:

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd money-management
   ```

2. **Install Dependensi**
   Pastikan Anda sudah memiliki [Bun](https://bun.sh/) di PC Anda.
   ```bash
   bun install
   ```

3. **Konfigurasi Environment Variable**
   Duplikat file `.env.example` menjadi `.env` atau buat file baru bernama `.env`. Sesuaikan parameter kredensial `DATABASE_URL` dengan MySQL di sistem Anda.
   ```env
   PORT=3000
   DATABASE_URL=mysql://root:password@localhost:3306/money_management_db
   ```

4. **Setup Database**
   Pastikan Anda telah membuat database MySQL bernama `money_management_db` sebelumnya secara manual. Lalu jalankan sinkronisasi schema tabel via Drizzle:
   ```bash
   bun run db:push
   ```

## Cara Run Aplikasi

Jalankan perintah ini untuk menjalankan aplikasi dalam mode *development* yang mendukung fitur auto/hot-reload:
```bash
bun run dev
```

Aplikasi Anda kini sudah bisa diakses lewat `http://localhost:3000`.

## Cara Test Aplikasi

Proyek ini telah dilengkapi dengan metode *integration test* yang lengkap dan mengandalkan fitur `bun test`. Semua skenario mengisolasi datanya secara mandiri dengan memastikan *cleanup* database (sebelum dan sesudah testing) dieksekusi dengan sempurna.

Jalankan perintah berikut untuk menjalankan seluruh *test suite*:
```bash
bun test
```
