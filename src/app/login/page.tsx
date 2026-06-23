import { redirect } from "next/navigation";
import { login } from "@/app/auth-actions";
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
    <main className="shell-grid grid min-h-screen place-items-center p-4 text-[var(--ink)] md:p-8">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/90 card-shadow backdrop-blur lg:grid-cols-[1fr_0.85fr]">
        <div className="bg-[var(--forest)] p-8 text-white md:p-12">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-white/60">Gentosai secure access</p>
          <h1 className="display-font mt-5 text-5xl font-black leading-none tracking-tight md:text-7xl">
            Masuk ke pusat operasi sekolah.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">
            Gunakan akun demo untuk mencoba dashboard sesuai role. Password semua akun demo: <strong>password123</strong>.
          </p>
          <div className="mt-8 grid gap-3">
            {demoAccounts.map((email) => (
              <div key={email} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white/90">
                {email}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 md:p-12">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--clay)]">Login</p>
          <h2 className="display-font mt-3 text-4xl font-black text-[var(--forest)]">Selamat datang kembali</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Auth ini sudah memakai password hash dan session cookie HTTP-only untuk fondasi production.
          </p>

          {params.error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
              Email atau password salah. Coba akun demo yang tersedia.
            </div>
          ) : null}

          <form action={login} className="mt-8 grid gap-5">
            <label className="grid gap-2 text-sm font-bold text-[var(--forest)]">
              Email
              <input
                name="email"
                type="email"
                defaultValue="kepsek@gentosai.sch.id"
                className="min-h-12 rounded-2xl border border-[var(--line)] bg-white px-4 outline-none transition focus:border-[var(--forest)] focus:ring-4 focus:ring-[rgba(18,63,56,0.12)]"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[var(--forest)]">
              Password
              <input
                name="password"
                type="password"
                defaultValue="password123"
                className="min-h-12 rounded-2xl border border-[var(--line)] bg-white px-4 outline-none transition focus:border-[var(--forest)] focus:ring-4 focus:ring-[rgba(18,63,56,0.12)]"
                required
              />
            </label>
            <button className="rounded-2xl bg-[var(--forest)] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[rgba(18,63,56,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0c302b]">
              Masuk dashboard
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
