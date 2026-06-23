# Gentosai SchoolOS

Gentosai SchoolOS adalah aplikasi manajemen sekolah berbasis web: data siswa, guru, kelas, absensi, jadwal, nilai, rapor, SPP, dashboard kepala sekolah, dan early warning system.

**Siap deploy ke Vercel dengan Supabase Postgres.**

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Prisma 7 + PostgreSQL (Supabase)
- Driver adapter `@prisma/adapter-pg`

## Fitur MVP Saat Ini

- Dashboard sekolah real-time dari Supabase Postgres.
- Login dengan password hash dan session cookie HTTP-only.
- Akun demo per role: kepala sekolah, admin, guru, keuangan, BK, orang tua, siswa.
- Data master: siswa, wali, guru, kelas, mapel.
- Form tambah siswa, guru, dan kelas.
- Input absensi harian dengan status hadir, sakit, izin, alpha, terlambat.
- Input nilai per siswa, mapel, guru, dan penilaian.
- Tagihan SPP, pembayaran, status lunas/cicilan/tunggakan.
- Early warning siswa berisiko berdasarkan absensi, nilai rendah, tunggakan, dan catatan negatif.
- Jadwal pelajaran, pengumuman, catatan BK, dan ringkasan rapor sederhana.

## Cara Menjalankan Lokal

Pastikan `.env` berisi `DATABASE_URL` dan `DIRECT_URL` Supabase Postgres.

```bash
cd /home/acer/gentosai
npm install
npm run db:push
npm run db:seed
npm run dev
```

Buka `http://localhost:3000`.

## Akun Demo

Semua akun demo memakai password berikut:

```text
password123
```

Email yang bisa dipakai:

```text
kepsek@gentosai.sch.id
admin@gentosai.sch.id
maya@gentosai.sch.id
finance@gentosai.sch.id
bk@gentosai.sch.id
wali1@example.com
alya.putri@siswa.gentosai.sch.id
```

## Script Penting

```bash
npm run dev       # menjalankan server development
npm run build     # validasi production build
npm run lint      # cek linting
npm run db:push   # sinkron schema Prisma ke Supabase Postgres
npm run db:seed   # reset dan isi data demo ke Postgres
npm run db:studio # buka Prisma Studio
```

## Database

- Hosting: Supabase PostgreSQL (project: `omzhzhimyzsntoegvtku`, region: ap-southeast-1)
- Koneksi: Transaction pooler (6543) untuk app, Session mode (5432) untuk migrasi
- `DATABASE_URL` / `DIRECT_URL` di `.env`
- Contoh environment: `.env.example`
- Schema: `prisma/schema.prisma`
- Data demo: `prisma/seed.cjs`

Untuk reset data:

```bash
npm run db:push
npm run db:seed
```

## Catatan Auth

MVP ini sudah memakai password hash, session table, session cookie HTTP-only, login/logout, dan guard halaman utama. Server action penting juga sudah dicek berdasarkan role. Tahap production tetap perlu menambahkan reset password, audit log lebih detail, validasi form berbasis schema, rate limit, dan hardening deployment.

## Push ke GitHub Nanti

Setelah GitHub CLI atau repo kosong siap:

```bash
cd /home/acer/gentosai
git status
git add .
git commit -m "Initial Gentosai SchoolOS MVP"
git branch -M main
git remote add origin <URL_REPO_GITHUB_KAMU>
git push -u origin main
```

Kalau `gh` sudah terpasang dan login:

```bash
gh auth login
gh repo create gentosai --private --source=. --remote=origin --push
```

## Roadmap Singkat

1. Stabilkan MVP: validasi form, edit/hapus data, filter tabel, dan export Excel/PDF.
2. Auth production: login, permission per role, audit log, dan proteksi route.
3. Akademik lengkap: bank soal, tugas, ujian, bobot nilai, rapor PDF.
4. Keuangan lengkap: invoice massal, diskon/beasiswa, payment gateway, reminder WhatsApp.
5. Parent/student portal: PWA khusus orang tua dan siswa.
6. AI assistant: ringkasan siswa, deskripsi rapor, generator surat, dan query dashboard natural language.
7. Deployment: PostgreSQL, object storage, backup otomatis, monitoring, dan CI/CD.
