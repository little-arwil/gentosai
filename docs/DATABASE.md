# Database Gentosai MVP

Database MVP dirancang sebagai fondasi SchoolOS dan saat ini berjalan di Supabase PostgreSQL untuk mendukung deployment Vercel.

## Entitas Inti

- `School`: profil sekolah.
- `User`: akun sistem dan role.
- `Session`: sesi login berbasis token hash dan expiry.
- `AcademicYear`: tahun ajaran.
- `Semester`: semester aktif.
- `Guardian`: orang tua atau wali siswa.
- `Student`: data siswa.
- `Teacher`: data guru.
- `SchoolClass`: kelas atau rombel.
- `ClassMembership`: riwayat siswa dalam kelas.
- `Subject`: mata pelajaran.
- `TeachingAssignment`: penugasan guru, mapel, dan kelas.
- `Schedule`: jadwal pelajaran.

## Modul Operasional

- `Attendance`: absensi siswa per tanggal dan kelas.
- `Grade`: nilai per siswa, mapel, guru, semester, dan jenis penilaian.
- `ReportCard`: rapor ringkas per siswa dan semester.
- `Invoice`: tagihan seperti SPP.
- `Payment`: pembayaran tagihan.
- `StudentNote`: catatan BK, prestasi, disiplin, atau wali kelas.
- `Announcement`: pengumuman sekolah.

## Prinsip Relasi

- Semua data utama terhubung ke `School` agar nanti bisa dikembangkan menjadi multi-sekolah.
- `Session` hanya menyimpan hash token, bukan token mentah dari cookie.
- Siswa tidak langsung menyimpan `classId`; kelas disimpan lewat `ClassMembership` supaya riwayat pindah kelas tetap aman.
- Nilai selalu menyimpan `teacherId`, `subjectId`, dan `semesterId` supaya audit akademik jelas.
- Tagihan menyimpan `amount`, `paidAmount`, dan `status` agar dashboard keuangan cepat dihitung.
- Absensi memakai unique key `studentId + classId + date` supaya satu siswa tidak punya duplikasi absensi di hari yang sama untuk kelas aktif.

## Status dan Enum

- `UserRole`: super admin, kepala sekolah, admin, guru, wali kelas, keuangan, BK, siswa, orang tua.
- `StudentStatus`: aktif, lulus, pindah, nonaktif.
- `AttendanceStatus`: hadir, sakit, izin, alpha, terlambat.
- `PaymentStatus`: belum bayar, cicilan, lunas, tunggakan.

## Status PostgreSQL

Migrasi SQLite → PostgreSQL sudah dilakukan.

1. `prisma/schema.prisma` memakai provider `postgresql`.
2. Runtime memakai `DATABASE_URL` Supabase transaction pooler.
3. Prisma schema push/migrasi memakai `DIRECT_URL` Supabase session pooler.
4. Seed data demo tersimpan di Supabase.
5. Tahap berikutnya: review tipe data uang untuk nominal besar (`BigInt`/decimal), tambah index query dashboard, dan hardening RLS/API exposure bila nanti tabel dipakai lewat Supabase Data API.
