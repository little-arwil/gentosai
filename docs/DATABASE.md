# Database Gentosai MVP

Database MVP dirancang sebagai fondasi SchoolOS. Saat development lokal memakai SQLite, tetapi struktur dibuat supaya mudah dipindah ke PostgreSQL.

## Entitas Inti

- `School`: profil sekolah.
- `User`: akun sistem dan role.
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
- Siswa tidak langsung menyimpan `classId`; kelas disimpan lewat `ClassMembership` supaya riwayat pindah kelas tetap aman.
- Nilai selalu menyimpan `teacherId`, `subjectId`, dan `semesterId` supaya audit akademik jelas.
- Tagihan menyimpan `amount`, `paidAmount`, dan `status` agar dashboard keuangan cepat dihitung.
- Absensi memakai unique key `studentId + classId + date` supaya satu siswa tidak punya duplikasi absensi di hari yang sama untuk kelas aktif.

## Status dan Enum

- `UserRole`: super admin, kepala sekolah, admin, guru, wali kelas, keuangan, BK, siswa, orang tua.
- `StudentStatus`: aktif, lulus, pindah, nonaktif.
- `AttendanceStatus`: hadir, sakit, izin, alpha, terlambat.
- `PaymentStatus`: belum bayar, cicilan, lunas, tunggakan.

## Migrasi ke PostgreSQL

Saat siap production:

1. Ubah datasource provider dari `sqlite` ke `postgresql`.
2. Ganti `DATABASE_URL` ke URL PostgreSQL.
3. Jalankan migrasi Prisma.
4. Review tipe data uang; untuk nominal besar bisa pakai `BigInt` atau decimal sesuai kebutuhan.
5. Tambahkan index untuk query dashboard, terutama `schoolId`, `studentId`, `classId`, `semesterId`, `dueDate`, dan `status`.
