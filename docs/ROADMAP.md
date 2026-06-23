# Roadmap Step-by-Step Gentosai Sampai Production

Dokumen ini adalah jalur kerja dari prototype lokal sampai aplikasi sekolah siap dipakai nyata.

## Phase 0 - Fondasi Project

Status: selesai untuk MVP lokal.

1. Scaffold Next.js, TypeScript, Tailwind.
2. Pasang Prisma dan SQLite development.
3. Buat schema database inti sekolah.
4. Buat seed data demo.
5. Buat dashboard awal dan form operasional.
6. Validasi dengan lint dan production build.

## Phase 1 - MVP Operasional Sekolah

Target: sekolah bisa memakai sistem untuk aktivitas harian dasar.

1. Data master
   - CRUD siswa, wali, guru, kelas, mapel.
   - Import Excel untuk siswa dan guru.
   - Riwayat pindah kelas.
2. Absensi
   - Absensi per hari dan per jam pelajaran.
   - Rekap per siswa, kelas, bulan, semester.
   - Surat izin dari orang tua.
3. Akademik
   - Jadwal pelajaran.
   - Input nilai per kategori.
   - Bobot nilai configurable.
   - Rapor sederhana.
4. Keuangan
   - Tagihan SPP per siswa atau per kelas.
   - Pembayaran manual.
   - Rekap tunggakan.
   - Export laporan.
5. Komunikasi
   - Pengumuman sekolah.
   - Pengumuman per kelas.
   - Notifikasi email/WhatsApp tahap awal.

Definition of Done:

- Semua modul punya tambah, edit, hapus, pencarian, filter, dan export.
- Ada role permission minimum untuk kepala sekolah, admin, guru, keuangan, BK, orang tua, dan siswa.
- Data bisa dibackup dan direstore.

## Phase 2 - Auth dan Security Production

Target: aman untuk data nyata.

1. Login dengan email/password.
2. Password hashing dan reset password.
3. Session management.
4. RBAC granular per menu dan aksi.
5. Proteksi server action dan route.
6. Audit log untuk perubahan data penting.
7. Validasi input server-side dengan schema validator.
8. Rate limit untuk endpoint penting.
9. Kebijakan akses orang tua hanya ke anaknya.
10. Backup database otomatis.

Definition of Done:

- Tidak ada server action sensitif yang bisa dipanggil tanpa otorisasi.
- Semua perubahan data penting tercatat di audit log.
- Akun non-admin tidak bisa mengakses data lintas role.

## Phase 3 - Akademik Lengkap

Target: guru dan kurikulum tidak perlu rekap manual.

1. Struktur tahun ajaran, semester, fase, kelas, mapel.
2. Penugasan guru ke kelas dan mapel.
3. Kalender akademik.
4. Tugas, materi, dan pengumpulan online.
5. Bank soal.
6. Ujian/kuis online.
7. Rubrik penilaian.
8. Formula nilai akhir.
9. Validasi nilai belum lengkap.
10. Rapor PDF dan arsip rapor.
11. Approval rapor oleh wali kelas dan kepala sekolah.

Definition of Done:

- Rapor bisa dicetak massal.
- Guru bisa melihat daftar nilai yang belum lengkap.
- Kepala sekolah bisa melihat progres input nilai per kelas dan guru.

## Phase 4 - Keuangan Lengkap

Target: sekolah bisa memantau pemasukan dan tunggakan akurat.

1. Master jenis tagihan.
2. Generate tagihan massal per kelas, angkatan, atau siswa.
3. Diskon, beasiswa, cicilan.
4. Payment gateway.
5. Bukti bayar otomatis.
6. Reminder jatuh tempo.
7. Rekonsiliasi pembayaran.
8. Laporan kas masuk.
9. Laporan piutang.
10. Export Excel/PDF.

Definition of Done:

- Admin keuangan tahu sisa tunggakan real-time.
- Orang tua bisa melihat status tagihan dan riwayat pembayaran.
- Laporan bulanan bisa langsung diekspor.

## Phase 5 - Portal Orang Tua dan Siswa

Target: orang tua dan siswa mendapat informasi penting tanpa bergantung pada chat grup.

1. Dashboard orang tua per anak.
2. Dashboard siswa.
3. Jadwal hari ini.
4. Tugas dan nilai.
5. Absensi dan riwayat izin.
6. Tagihan dan pembayaran.
7. Pengumuman.
8. Rapor digital.
9. Daily digest untuk orang tua.
10. PWA mobile-friendly.

Definition of Done:

- Orang tua bisa login dan hanya melihat anaknya.
- Semua informasi penting bisa diakses dari HP.
- Daily digest bisa dikirim otomatis.

## Phase 6 - AI Assistant Gentosai

Target: sistem membantu kerja admin dan guru, bukan hanya menyimpan data.

1. Ringkasan perkembangan siswa.
2. Deskripsi rapor otomatis berdasarkan nilai dan catatan guru.
3. Generator surat sekolah.
4. Generator soal dari materi.
5. Tanya dashboard dengan bahasa natural.
6. Rekomendasi tindak lanjut siswa berisiko.
7. Deteksi data anomali seperti nilai kosong atau absensi turun drastis.

Definition of Done:

- AI hanya memakai data yang boleh diakses role tersebut.
- Semua output AI bisa diedit manusia sebelum dipakai resmi.
- Ada log penggunaan AI untuk audit.

## Phase 7 - Deployment dan Operasional

Target: siap dipakai sekolah nyata.

1. Migrasi database dari SQLite ke PostgreSQL.
2. Setup object storage untuk dokumen.
3. Dockerfile dan docker compose.
4. CI/CD build, lint, test.
5. VPS atau cloud deployment.
6. Domain dan HTTPS.
7. Backup database harian.
8. Monitoring error dan uptime.
9. Log retention.
10. Disaster recovery plan.

Definition of Done:

- Production bisa deploy ulang tanpa kehilangan data.
- Backup bisa direstore.
- Error penting bisa terdeteksi cepat.

## Urutan Coding Berikutnya

1. Pisahkan halaman menjadi route: `/dashboard`, `/students`, `/attendance`, `/academics`, `/finance`, `/settings`.
2. Tambahkan edit dan delete untuk siswa, guru, kelas, tagihan, dan nilai.
3. Tambahkan autentikasi production.
4. Tambahkan permission guard per route.
5. Tambahkan validasi server-side untuk semua form.
6. Tambahkan test untuk server action penting.
7. Tambahkan export Excel/PDF.
8. Siapkan migrasi PostgreSQL dan deployment.
