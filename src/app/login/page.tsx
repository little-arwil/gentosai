import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const demoAccounts = [
  "kepsek@gentosai.sch.id",
  "admin@gentosai.sch.id",
  "maya@gentosai.sch.id",
  "finance@gentosai.sch.id",
  "bk@gentosai.sch.id",
  "wali1@example.com",
  "alya.putri@siswa.gentosai.sch.id",
];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const auth = await getCurrentUser();
  if (auth) {
    redirect("/");
  }

  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center p-4 text-[var(--ink)] md:p-8">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_2px_24px_rgba(26,75,107,0.06)] lg:grid-cols-[1fr_0.85fr]">
        <div className="bg-[var(--paper)] p-8 md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--azure)]">Gentosai secure access</p>
          <h1 className="mt-5 text-5xl font-bold leading-none tracking-tight text-[var(--ocean)] md:text-6xl">
            Masuk ke pusat operasi sekolah.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">
            Gunakan akun demo untuk mencoba dashboard sesuai role. Password semua akun demo: <strong className="text-[var(--ocean)]">password123</strong>.
          </p>
          <div className="mt-8 grid gap-2">
            {demoAccounts.map((email) => (
              <div key={email} className="rounded-lg border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ocean)]">
                {email}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--azure)]">Login</p>
          <h2 className="mt-3 text-4xl font-bold text-[var(--ocean)]">Selamat datang kembali</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Auth ini sudah memakai password hash dan session cookie HTTP-only untuk fondasi production.
          </p>

          {params.error ? (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
              Email atau password salah. Coba akun demo yang tersedia.
            </div>
          ) : null}

          <form action="/api/login" method="post" className="mt-8 grid gap-5">
            <label className="grid gap-2 text-sm font-semibold text-[var(--ocean)]">
              Email
              <input
                name="email"
                type="email"
                defaultValue="kepsek@gentosai.sch.id"
                className="min-h-12 rounded-lg border border-[var(--line)] bg-white px-4 outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(37,99,235,0.18)]"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--ocean)]">
              Password
              <input
                name="password"
                type="password"
                defaultValue="password123"
                className="min-h-12 rounded-lg border border-[var(--line)] bg-white px-4 outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(37,99,235,0.18)]"
                required
              />
            </label>
            <button className="rounded-lg bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]">
              Masuk dashboard
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
