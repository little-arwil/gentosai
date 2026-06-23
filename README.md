# Gentosai SchoolOS

Gentosai SchoolOS adalah prototype lokal untuk sistem operasional sekolah: data siswa, guru, kelas, absensi, jadwal, nilai, rapor sederhana, SPP, dashboard kepala sekolah, dan early warning system.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Prisma 7
- SQLite untuk development lokal
- Driver adapter `@prisma/adapter-better-sqlite3`

## Fitur MVP Saat Ini

- Dashboard sekolah real-time dari database lokal.
- Mode role demo: kepala sekolah, admin, guru, wali kelas, keuangan, BK, orang tua, siswa.
- Data master: siswa, wali, guru, kelas, mapel.
- Form tambah siswa, guru, dan kelas.
- Input absensi harian dengan status hadir, sakit, izin, alpha, terlambat.
- Input nilai per siswa, mapel, guru, dan penilaian.
- Tagihan SPP, pembayaran, status lunas/cicilan/tunggakan.
- Early warning siswa berisiko berdasarkan absensi, nilai rendah, tunggakan, dan catatan negatif.
- Jadwal pelajaran, pengumuman, catatan BK, dan ringkasan rapor sederhana.

## Cara Menjalankan Lokal

```bash
cd /home/acer/gentosai
npm install
npm run db:push
npm run db:seed
npm run dev
```

Buka `http://localhost:3000`.

## Script Penting

```bash
npm run dev       # menjalankan server development
npm run build     # validasi production build
npm run lint      # cek linting
npm run db:push   # sinkron schema Prisma ke SQLite
npm run db:seed   # reset dan isi data demo
npm run db:studio # buka Prisma Studio
```

## Database Lokal

- File database: `dev.db`
- Konfigurasi environment: `.env`
- Contoh environment: `.env.example`
- Schema utama: `prisma/schema.prisma`
- Data demo: `prisma/seed.cjs`

Untuk reset data demo:

```bash
npm run db:push
npm run db:seed
```

## Catatan Auth

MVP ini memakai role switcher berbasis cookie untuk demo alur kerja. Ini belum auth production. Tahap production harus menambahkan login aman, password hashing, session management, RBAC detail, audit log, dan proteksi server action.

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
