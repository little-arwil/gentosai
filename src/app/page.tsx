import type { AttendanceStatus, PaymentStatus, Prisma, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  createClass,
  createGrade,
  createInvoice,
  createStudent,
  createTeacher,
  recordAttendance,
  recordPayment,
} from "./actions";
import { logout } from "./auth-actions";
import { attendanceLabels, formatCurrency, formatDate, formatPercent, paymentLabels, toDateInputValue } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roleDescriptions, roleLabels } from "@/lib/role";

export const dynamic = "force-dynamic";

const dayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const roleFocus: Record<UserRole, string[]> = {
  SUPER_ADMIN: ["Audit aktivitas", "Konfigurasi sekolah", "Kontrol role", "Kesehatan sistem"],
  PRINCIPAL: ["Kesehatan sekolah hari ini", "Siswa berisiko", "Kinerja kelas", "Arus kas masuk"],
  ADMIN: ["Data siswa", "Data guru", "Kelas aktif", "Dokumen akademik"],
  TEACHER: ["Absensi kelas", "Input nilai", "Jadwal mengajar", "Catatan siswa"],
  HOMEROOM: ["Pantau kelas binaan", "Rapor", "Absensi bermasalah", "Komunikasi wali"],
  FINANCE: ["Tagihan SPP", "Pembayaran", "Tunggakan", "Reminder wali"],
  COUNSELOR: ["Catatan BK", "Pelanggaran", "Prestasi", "Tindak lanjut siswa"],
  STUDENT: ["Jadwal hari ini", "Nilai", "Tagihan", "Pengumuman"],
  GUARDIAN: ["Kehadiran anak", "Tagihan", "Nilai", "Pengumuman sekolah"],
};

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function statusTone(status: AttendanceStatus | PaymentStatus | string) {
  if (["PRESENT", "PAID", "Aman"].includes(status)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (["LATE", "PARTIAL", "Perlu Dipantau"].includes(status)) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (["ABSENT", "OVERDUE", "Butuh Tindakan"].includes(status)) {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function averageScore(scores: { score: number; weight: number }[]) {
  const totalWeight = scores.reduce((total, score) => total + score.weight, 0);
  if (!scores.length || totalWeight === 0) {
    return 0;
  }

  return scores.reduce((total, score) => total + score.score * score.weight, 0) / totalWeight;
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--forest)]">
      <span>{label}</span>
      {children}
    </label>
  );
}

function inputClass() {
  return "min-h-11 rounded-2xl border border-[var(--line)] bg-white/90 px-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--forest)] focus:ring-4 focus:ring-[rgba(18,63,56,0.12)]";
}

function Button({ children }: { children: React.ReactNode }) {
  return (
    <button className="rounded-2xl bg-[var(--forest)] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[rgba(18,63,56,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0c302b]">
      {children}
    </button>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${tone ?? "border-[var(--line)] bg-white text-[var(--muted)]"}`}>
      {children}
    </span>
  );
}

function MetricCard({ label, value, hint, accent }: { label: string; value: string; hint: string; accent: string }) {
  return (
    <section className="lift-in rounded-[2rem] border border-white/80 bg-white/80 p-5 card-shadow backdrop-blur">
      <div className={`mb-5 h-2 w-16 rounded-full ${accent}`} />
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="display-font mt-3 text-4xl font-black tracking-tight text-[var(--forest)]">{value}</p>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{hint}</p>
    </section>
  );
}

function Panel({ children, kicker, title }: { children: React.ReactNode; kicker: string; title: string }) {
  return (
    <section className="rounded-[2rem] border border-white/80 bg-white/85 p-5 card-shadow backdrop-blur md:p-7">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--clay)]">{kicker}</p>
      <h2 className="display-font mt-2 text-2xl font-black text-[var(--forest)] md:text-3xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default async function Home() {
  const auth = await getCurrentUser();
  if (!auth) {
    redirect("/login");
  }

  const currentUser = auth.user;
  const activeRole = currentUser.role as UserRole;
  const school = await prisma.school.findUnique({
    where: { id: currentUser.schoolId },
    include: {
      academicYears: {
        where: { isActive: true },
        include: { semesters: { where: { isActive: true }, take: 1 } },
        take: 1,
      },
    },
  });

  if (!school) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="max-w-xl rounded-[2rem] border border-[var(--line)] bg-white p-8 text-center card-shadow">
          <p className="display-font text-3xl font-black text-[var(--forest)]">Database belum berisi data sekolah.</p>
          <p className="mt-4 text-[var(--muted)]">Jalankan `npm run db:push && npm run db:seed`, lalu buka ulang halaman ini.</p>
        </div>
      </main>
    );
  }

  const academicYear = school.academicYears[0];
  const semester = academicYear?.semesters[0];
  const today = startOfToday();
  const tomorrow = addDays(today, 1);
  const scopedStudentWhere: Prisma.StudentWhereInput = {
    schoolId: school.id,
    status: "ACTIVE",
    ...(activeRole === "STUDENT" ? { userId: currentUser.id } : {}),
    ...(activeRole === "GUARDIAN" ? { guardian: { userId: currentUser.id } } : {}),
  };
  const scopedInvoiceWhere: Prisma.InvoiceWhereInput = {
    schoolId: school.id,
    ...(activeRole === "STUDENT" || activeRole === "GUARDIAN" ? { student: scopedStudentWhere } : {}),
  };
  const scopedStudentRelationWhere = activeRole === "STUDENT" || activeRole === "GUARDIAN" ? { student: scopedStudentWhere } : {};

  const [students, teachers, classes, subjects, attendanceToday, invoices, schedules, grades, reportCards, notes, announcements] = await Promise.all([
    prisma.student.findMany({
      where: scopedStudentWhere,
      include: {
        guardian: true,
        classMemberships: {
          where: { leftAt: null },
          include: { class: { include: { homeroomTeacher: true } } },
          take: 1,
        },
        attendances: { where: { date: { gte: today, lt: tomorrow } }, take: 1 },
        grades: true,
        invoices: true,
        notes: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.teacher.findMany({ where: { schoolId: school.id }, orderBy: { name: "asc" } }),
    prisma.schoolClass.findMany({
      where: { schoolId: school.id },
      include: { homeroomTeacher: true, memberships: { where: { leftAt: null } } },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    }),
    prisma.subject.findMany({ where: { schoolId: school.id }, orderBy: { name: "asc" } }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: { date: { gte: today, lt: tomorrow }, student: scopedStudentWhere },
      _count: { _all: true },
    }),
    prisma.invoice.findMany({
      where: scopedInvoiceWhere,
      include: { student: true, class: true, payments: { orderBy: { paidAt: "desc" } } },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    }),
    prisma.schedule.findMany({
      include: { class: true, subject: true, teacher: true },
      orderBy: [{ dayOfWeek: "asc" }, { startsAt: "asc" }],
    }),
    prisma.grade.findMany({
      where: scopedStudentRelationWhere,
      include: { student: true, subject: true, teacher: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.reportCard.findMany({ where: scopedStudentRelationWhere, include: { student: true, semester: true }, orderBy: { averageScore: "desc" } }),
    prisma.studentNote.findMany({ where: scopedStudentRelationWhere, include: { student: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.announcement.findMany({ where: { schoolId: school.id }, orderBy: { publishedAt: "desc" }, take: 5 }),
  ]);

  const totalAttendance = attendanceToday.reduce((total, row) => total + row._count._all, 0);
  const presentCount = attendanceToday
    .filter((row) => row.status === "PRESENT" || row.status === "LATE")
    .reduce((total, row) => total + row._count._all, 0);
  const attendanceRate = totalAttendance ? (presentCount / totalAttendance) * 100 : 0;
  const collected = invoices.reduce((total, invoice) => total + invoice.paidAmount, 0);
  const receivable = invoices.reduce((total, invoice) => total + invoice.amount, 0);
  const outstanding = receivable - collected;
  const overdueCount = invoices.filter((invoice) => invoice.status === "OVERDUE").length;

  const activeStudents = students.map((student) => {
    const activeClass = student.classMemberships[0]?.class;
    const avg = averageScore(student.grades);
    const overdue = student.invoices.filter((invoice) => invoice.status === "OVERDUE" || invoice.dueDate < today && invoice.paidAmount < invoice.amount);
    const attendanceStatus = student.attendances[0]?.status;
    const negativeNotes = student.notes.filter((note) => note.points < 0);
    const riskScore = overdue.length * 35 + (attendanceStatus === "ABSENT" ? 35 : attendanceStatus === "LATE" ? 15 : 0) + (avg > 0 && avg < 75 ? 25 : 0) + negativeNotes.length * 15;
    const label = riskScore >= 60 ? "Butuh Tindakan" : riskScore >= 25 ? "Perlu Dipantau" : "Aman";

    return { student, activeClass, avg, overdue, attendanceStatus, negativeNotes, riskScore, label };
  });

  const riskStudents = activeStudents.filter((item) => item.riskScore > 0).sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
  const firstStudentRef = activeStudents.find((item) => item.activeClass)?.student.id;
  const firstClassRef = activeStudents.find((item) => item.activeClass)?.activeClass?.id;
  return (
    <main className="shell-grid min-h-screen p-4 text-[var(--ink)] md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="overflow-hidden rounded-[2.5rem] border border-white/80 bg-[var(--forest)] text-white card-shadow">
          <div className="grid gap-8 p-6 md:grid-cols-[1.4fr_0.8fr] md:p-10">
            <div>
              <Pill tone="border-white/20 bg-white/10 text-white">Gentosai SchoolOS MVP</Pill>
              <h1 className="display-font mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
                Satu data sekolah, satu dashboard keputusan.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/76">
                Prototype lokal untuk mengelola siswa, guru, kelas, absensi, nilai, rapor sederhana, SPP, dan early warning system.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60">Sekolah</p>
                  <p className="mt-2 font-bold">{school.name}</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60">Tahun Ajaran</p>
                  <p className="mt-2 font-bold">{academicYear?.name ?? "Belum aktif"}</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60">Semester</p>
                  <p className="mt-2 font-bold">{semester?.name ?? "Belum aktif"}</p>
                </div>
              </div>
            </div>

            <aside className="rounded-[2rem] bg-[var(--paper)] p-5 text-[var(--ink)]">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--clay)]">Sesi aktif</p>
              <h2 className="display-font mt-2 text-3xl font-black text-[var(--forest)]">{currentUser.name}</h2>
              <p className="mt-2 text-sm font-bold text-[var(--clay)]">{currentUser.email}</p>
              <Pill tone="mt-4 border-[var(--forest)] bg-white text-[var(--forest)]">{roleLabels[activeRole]}</Pill>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{roleDescriptions[activeRole]}</p>
              <form action={logout} className="mt-5">
                <Button>Logout</Button>
              </form>
              <div className="mt-5 grid gap-2">
                {roleFocus[activeRole].map((item) => (
                  <div key={item} className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-bold text-[var(--forest)]">
                    {item}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Siswa aktif" value={String(students.length)} hint={`${classes.length} kelas aktif dalam sistem demo`} accent="bg-[var(--moss)]" />
          <MetricCard label="Kehadiran hari ini" value={`${formatPercent(attendanceRate)}%`} hint={`${presentCount} dari ${totalAttendance || students.length} absensi tercatat`} accent="bg-[var(--sky)]" />
          <MetricCard label="Kas masuk SPP" value={formatCurrency(collected)} hint={`${formatCurrency(outstanding)} masih perlu ditagih`} accent="bg-[var(--sun)]" />
          <MetricCard label="Siswa berisiko" value={String(riskStudents.length)} hint={`${overdueCount} tagihan masuk status tunggakan`} accent="bg-[var(--clay)]" />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel kicker="Early warning" title="Siswa yang perlu perhatian cepat">
            <div className="grid gap-3">
              {riskStudents.length === 0 ? (
                <p className="rounded-3xl border border-[var(--line)] bg-white p-5 text-[var(--muted)]">Semua siswa dalam kondisi aman berdasarkan data hari ini.</p>
              ) : (
                riskStudents.map(({ student, activeClass, avg, overdue, attendanceStatus, negativeNotes, label }) => (
                  <article key={student.id} className="grid gap-4 rounded-3xl border border-[var(--line)] bg-white p-5 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="display-font text-xl font-black text-[var(--forest)]">{student.name}</h3>
                        <Pill>{activeClass?.name ?? "Tanpa kelas"}</Pill>
                        <Pill tone={statusTone(label)}>{label}</Pill>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        Rata-rata {avg ? formatPercent(avg) : "belum ada nilai"}. Absensi hari ini {attendanceStatus ? attendanceLabels[attendanceStatus] : "belum diisi"}. {overdue.length} tunggakan. {negativeNotes.length} catatan negatif.
                      </p>
                    </div>
                    <a className="rounded-2xl border border-[var(--forest)] px-4 py-3 text-center text-sm font-black text-[var(--forest)]" href="#bk">
                      Tindak lanjut
                    </a>
                  </article>
                ))
              )}
            </div>
          </Panel>

          <Panel kicker="Pengumuman" title="Kabar penting sekolah">
            <div className="grid gap-3">
              {announcements.map((announcement) => (
                <article key={announcement.id} className="rounded-3xl border border-[var(--line)] bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-black text-[var(--forest)]">{announcement.title}</h3>
                    <Pill>{announcement.audience}</Pill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{announcement.content}</p>
                  <p className="mt-3 text-xs font-bold text-[var(--clay)]">{formatDate(announcement.publishedAt)}</p>
                </article>
              ))}
            </div>
          </Panel>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-3">
          <Panel kicker="Quick input" title="Tambah siswa">
            <form action={createStudent} className="grid gap-4">
              <Field label="Nama siswa"><input name="studentName" className={inputClass()} placeholder="Nama lengkap" required /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="NIS"><input name="nis" className={inputClass()} placeholder="GTS26009" required /></Field>
                <Field label="NISN"><input name="nisn" className={inputClass()} placeholder="Opsional" /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Gender">
                  <select name="gender" className={inputClass()} defaultValue="P"><option value="P">Perempuan</option><option value="L">Laki-laki</option></select>
                </Field>
                <Field label="Kelas">
                  <select name="classId" className={inputClass()} defaultValue={classes[0]?.id} required>
                    {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tempat lahir"><input name="birthPlace" className={inputClass()} placeholder="Bandung" required /></Field>
                <Field label="Tanggal lahir"><input name="birthDate" className={inputClass()} type="date" defaultValue="2012-01-01" required /></Field>
              </div>
              <Field label="Alamat"><textarea name="address" className={`${inputClass()} min-h-24 py-3`} placeholder="Alamat siswa" required /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama wali"><input name="guardianName" className={inputClass()} required /></Field>
                <Field label="No. HP wali"><input name="guardianPhone" className={inputClass()} required /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email wali"><input name="guardianEmail" className={inputClass()} type="email" /></Field>
                <Field label="Pekerjaan wali"><input name="guardianOccupation" className={inputClass()} /></Field>
              </div>
              <Button>Simpan siswa</Button>
            </form>
          </Panel>

          <Panel kicker="Quick input" title="Tambah guru">
            <form action={createTeacher} className="grid gap-4">
              <Field label="Nama guru"><input name="teacherName" className={inputClass()} required /></Field>
              <Field label="Email"><input name="teacherEmail" className={inputClass()} type="email" placeholder="guru@gentosai.sch.id" required /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="NIP"><input name="nip" className={inputClass()} /></Field>
                <Field label="No. HP"><input name="teacherPhone" className={inputClass()} /></Field>
              </div>
              <Field label="Keahlian"><input name="specialty" className={inputClass()} placeholder="Matematika" /></Field>
              <Button>Simpan guru</Button>
            </form>
          </Panel>

          <Panel kicker="Quick input" title="Tambah kelas">
            <form action={createClass} className="grid gap-4">
              <Field label="Nama kelas"><input name="className" className={inputClass()} placeholder="X-C" required /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tingkat"><input name="gradeLevel" className={inputClass()} type="number" min="1" defaultValue="10" required /></Field>
                <Field label="Kapasitas"><input name="capacity" className={inputClass()} type="number" min="1" defaultValue="32" required /></Field>
              </div>
              <Field label="Jurusan"><input name="major" className={inputClass()} defaultValue="Umum" /></Field>
              <Field label="Wali kelas">
                <select name="homeroomTeacherId" className={inputClass()} defaultValue="">
                  <option value="">Belum ditentukan</option>
                  {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                </select>
              </Field>
              <Button>Simpan kelas</Button>
            </form>
          </Panel>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-3">
          <Panel kicker="Operasional" title="Input absensi">
            <form action={recordAttendance} className="grid gap-4">
              <Field label="Siswa">
                <select name="attendanceStudentRef" className={inputClass()} defaultValue={firstStudentRef && firstClassRef ? `${firstStudentRef}:${firstClassRef}` : ""} required>
                  {activeStudents.filter((item) => item.activeClass).map(({ student, activeClass }) => (
                    <option key={student.id} value={`${student.id}:${activeClass?.id}`}>{student.name} - {activeClass?.name}</option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tanggal"><input name="attendanceDate" className={inputClass()} type="date" defaultValue={toDateInputValue(today)} required /></Field>
                <Field label="Status">
                  <select name="attendanceStatus" className={inputClass()} defaultValue="PRESENT">
                    {Object.entries(attendanceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Catatan"><textarea name="attendanceNote" className={`${inputClass()} min-h-24 py-3`} placeholder="Opsional" /></Field>
              <Button>Simpan absensi</Button>
            </form>
          </Panel>

          <Panel kicker="Akademik" title="Input nilai">
            <form action={createGrade} className="grid gap-4">
              <Field label="Siswa">
                <select name="gradeStudentId" className={inputClass()} defaultValue={students[0]?.id} required>
                  {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Mapel">
                  <select name="subjectId" className={inputClass()} defaultValue={subjects[0]?.id} required>
                    {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                  </select>
                </Field>
                <Field label="Guru">
                  <select name="gradeTeacherId" className={inputClass()} defaultValue={teachers[0]?.id} required>
                    {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Penilaian"><input name="assessment" className={inputClass()} placeholder="Formatif 2" required /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nilai"><input name="score" className={inputClass()} type="number" min="0" max="100" step="0.1" required /></Field>
                <Field label="Bobot"><input name="weight" className={inputClass()} type="number" min="0.1" step="0.1" defaultValue="1" required /></Field>
              </div>
              <Button>Simpan nilai</Button>
            </form>
          </Panel>
          <Panel kicker="Keuangan" title="Buat tagihan SPP">
            <form action={createInvoice} className="grid gap-4">
              <Field label="Siswa">
                <select name="invoiceStudentId" className={inputClass()} defaultValue={students[0]?.id} required>
                  {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                </select>
              </Field>
              <Field label="Kelas terkait">
                <select name="invoiceClassId" className={inputClass()} defaultValue={classes[0]?.id}>
                  {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </Field>
              <Field label="Judul tagihan"><input name="invoiceTitle" className={inputClass()} defaultValue="SPP Februari 2027" required /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nominal"><input name="amount" className={inputClass()} type="number" min="0" defaultValue="450000" required /></Field>
                <Field label="Jatuh tempo"><input name="dueDate" className={inputClass()} type="date" defaultValue={toDateInputValue(addDays(today, 14))} required /></Field>
              </div>
              <Button>Buat tagihan</Button>
            </form>
          </Panel>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel kicker="Keuangan" title="Catat pembayaran">
            <form action={recordPayment} className="grid gap-4">
              <Field label="Tagihan">
                <select name="paymentInvoiceId" className={inputClass()} defaultValue={invoices.find((invoice) => invoice.paidAmount < invoice.amount)?.id ?? invoices[0]?.id} required>
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>{invoice.student.name} - {invoice.title} - sisa {formatCurrency(invoice.amount - invoice.paidAmount)}</option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nominal bayar"><input name="paymentAmount" className={inputClass()} type="number" min="0" defaultValue="100000" required /></Field>
                <Field label="Tanggal bayar"><input name="paidAt" className={inputClass()} type="date" defaultValue={toDateInputValue(today)} required /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Metode"><input name="paymentMethod" className={inputClass()} defaultValue="Transfer Bank" required /></Field>
                <Field label="Referensi"><input name="paymentReference" className={inputClass()} placeholder="TRX-..." /></Field>
              </div>
              <Button>Simpan pembayaran</Button>
            </form>
          </Panel>

          <Panel kicker="Jadwal" title="Jadwal pelajaran aktif">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  <tr><th>Hari</th><th>Jam</th><th>Kelas</th><th>Mapel</th><th>Guru</th><th>Ruang</th></tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule.id} className="bg-white">
                      <td className="rounded-l-2xl px-4 py-3 font-bold">{dayNames[schedule.dayOfWeek - 1]}</td>
                      <td className="px-4 py-3">{schedule.startsAt} - {schedule.endsAt}</td>
                      <td className="px-4 py-3">{schedule.class.name}</td>
                      <td className="px-4 py-3">{schedule.subject.name}</td>
                      <td className="px-4 py-3">{schedule.teacher.name}</td>
                      <td className="rounded-r-2xl px-4 py-3">{schedule.room ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <Panel kicker="Data master" title="Siswa aktif">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  <tr><th>Nama</th><th>NIS</th><th>Kelas</th><th>Wali</th><th>Absensi</th><th>Rata-rata</th></tr>
                </thead>
                <tbody>
                  {activeStudents.map(({ student, activeClass, attendanceStatus, avg }) => (
                    <tr key={student.id} className="bg-white">
                      <td className="rounded-l-2xl px-4 py-3 font-black text-[var(--forest)]">{student.name}</td>
                      <td className="px-4 py-3">{student.nis}</td>
                      <td className="px-4 py-3">{activeClass?.name ?? "-"}</td>
                      <td className="px-4 py-3">{student.guardian?.name ?? "-"}</td>
                      <td className="px-4 py-3"><Pill tone={attendanceStatus ? statusTone(attendanceStatus) : undefined}>{attendanceStatus ? attendanceLabels[attendanceStatus] : "Belum"}</Pill></td>
                      <td className="rounded-r-2xl px-4 py-3">{avg ? formatPercent(avg) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel kicker="Data master" title="Kelas dan guru">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-3">
                {classes.map((item) => (
                  <article key={item.id} className="rounded-3xl border border-[var(--line)] bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="display-font text-2xl font-black text-[var(--forest)]">{item.name}</h3>
                      <Pill>{item.memberships.length}/{item.capacity}</Pill>
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted)]">Wali kelas: {item.homeroomTeacher?.name ?? "Belum ditentukan"}</p>
                  </article>
                ))}
              </div>
              <div className="grid gap-3">
                {teachers.map((teacher) => (
                  <article key={teacher.id} className="rounded-3xl border border-[var(--line)] bg-white p-5">
                    <h3 className="font-black text-[var(--forest)]">{teacher.name}</h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">{teacher.specialty ?? "Guru mapel"}</p>
                    <p className="mt-1 text-xs font-bold text-[var(--clay)]">{teacher.email}</p>
                  </article>
                ))}
              </div>
            </div>
          </Panel>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <Panel kicker="Akademik" title="Nilai dan rapor sederhana">
            <div className="grid gap-3">
              {grades.map((grade) => (
                <article key={grade.id} className="rounded-3xl border border-[var(--line)] bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-black text-[var(--forest)]">{grade.student.name}</h3>
                    <Pill>{grade.score}</Pill>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">{grade.subject.name} - {grade.assessment} oleh {grade.teacher.name}</p>
                </article>
              ))}
              <div className="rounded-3xl border border-[var(--line)] bg-[#f8f2e6] p-5">
                <p className="font-black text-[var(--forest)]">Rapor tersimpan: {reportCards.length}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">Tahap berikutnya: generate rapor PDF, approval wali kelas, dan deskripsi nilai otomatis.</p>
              </div>
            </div>
          </Panel>

          <Panel kicker="Keuangan" title="Tagihan dan pembayaran">
            <div className="grid gap-3">
              {invoices.slice(0, 8).map((invoice) => (
                <article key={invoice.id} className="rounded-3xl border border-[var(--line)] bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-black text-[var(--forest)]">{invoice.student.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">{invoice.title} - jatuh tempo {formatDate(invoice.dueDate)}</p>
                    </div>
                    <Pill tone={statusTone(invoice.status)}>{paymentLabels[invoice.status]}</Pill>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#efe3d0]">
                    <div className="h-full rounded-full bg-[var(--moss)]" style={{ width: `${Math.min(100, (invoice.paidAmount / invoice.amount) * 100)}%` }} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-[var(--forest)]">{formatCurrency(invoice.paidAmount)} / {formatCurrency(invoice.amount)}</p>
                </article>
              ))}
            </div>
          </Panel>
        </section>

        <section id="bk" className="mt-6">
          <Panel kicker="BK dan karakter" title="Catatan siswa terbaru">
            <div className="grid gap-3 md:grid-cols-3">
              {notes.map((note) => (
                <article key={note.id} className="rounded-3xl border border-[var(--line)] bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <Pill tone={note.points < 0 ? statusTone("Butuh Tindakan") : statusTone("Aman")}>{note.category}</Pill>
                    <span className="text-sm font-black text-[var(--clay)]">{note.points > 0 ? "+" : ""}{note.points}</span>
                  </div>
                  <h3 className="mt-4 font-black text-[var(--forest)]">{note.title}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">{note.student.name}</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{note.content}</p>
                </article>
              ))}
            </div>
          </Panel>
        </section>

        <footer className="py-10 text-center text-sm font-bold text-[var(--muted)]">
          Gentosai MVP lokal. Siap dipush ke GitHub setelah repo dan auth GitHub disiapkan.
        </footer>
      </div>
    </main>
  );
}
