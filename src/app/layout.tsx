import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gentosai SchoolOS",
  description: "School operating system untuk absensi, akademik, rapor, dan keuangan sekolah.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
