import type { UserRole } from "@prisma/client";

export const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  PRINCIPAL: "Kepala Sekolah",
  ADMIN: "Tata Usaha",
  TEACHER: "Guru",
  HOMEROOM: "Wali Kelas",
  FINANCE: "Keuangan",
  COUNSELOR: "BK/Kesiswaan",
  STUDENT: "Siswa",
  GUARDIAN: "Orang Tua",
};

export const roleDescriptions: Record<UserRole, string> = {
  SUPER_ADMIN: "Kontrol penuh sistem dan konfigurasi multi-sekolah.",
  PRINCIPAL: "Melihat kesehatan sekolah, risiko siswa, dan performa operasional.",
  ADMIN: "Mengelola data siswa, guru, kelas, dan dokumen sekolah.",
  TEACHER: "Mengisi absensi, jadwal, nilai, dan catatan pembelajaran.",
  HOMEROOM: "Memantau kelas binaan, rapor, absensi, dan komunikasi wali.",
  FINANCE: "Mengelola tagihan, pembayaran, tunggakan, dan laporan kas masuk.",
  COUNSELOR: "Mencatat konseling, disiplin, prestasi, dan tindak lanjut siswa.",
  STUDENT: "Melihat jadwal, nilai, tugas, pengumuman, dan kartu pelajar digital.",
  GUARDIAN: "Memantau kehadiran, nilai, tagihan, dan kabar harian anak.",
};

export const roleOrder: UserRole[] = [
  "PRINCIPAL",
  "ADMIN",
  "TEACHER",
  "HOMEROOM",
  "FINANCE",
  "COUNSELOR",
  "GUARDIAN",
  "STUDENT",
  "SUPER_ADMIN",
];
