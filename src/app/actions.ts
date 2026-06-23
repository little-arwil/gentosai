"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { AttendanceStatus, PaymentStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ROLE_COOKIE, roleLabels } from "@/lib/role";

function readText(formData: FormData, key: string) {
  const value = formData.get(key)?.toString().trim();
  if (!value) {
    throw new Error(`${key} wajib diisi`);
  }
  return value;
}

function readOptionalText(formData: FormData, key: string) {
  const value = formData.get(key)?.toString().trim();
  return value || undefined;
}

function readNumber(formData: FormData, key: string) {
  const value = Number(readText(formData, key));
  if (!Number.isFinite(value)) {
    throw new Error(`${key} harus berupa angka`);
  }
  return value;
}

function readDate(formData: FormData, key: string) {
  return new Date(`${readText(formData, key)}T00:00:00`);
}

async function getSchoolContext() {
  const school = await prisma.school.findFirst({
    include: {
      academicYears: {
        where: { isActive: true },
        include: { semesters: { where: { isActive: true }, take: 1 } },
        take: 1,
      },
    },
  });

  const academicYear = school?.academicYears[0];
  const semester = academicYear?.semesters[0];

  if (!school || !academicYear || !semester) {
    throw new Error("Data sekolah demo belum siap. Jalankan npm run db:seed terlebih dulu.");
  }

  return { school, academicYear, semester };
}

export async function setActiveRole(formData: FormData) {
  const role = readText(formData, "role") as UserRole;
  if (!(role in roleLabels)) {
    throw new Error("Role tidak dikenal");
  }

  const cookieStore = await cookies();
  cookieStore.set(ROLE_COOKIE, role, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });

  revalidatePath("/");
}

export async function createTeacher(formData: FormData) {
  const { school } = await getSchoolContext();
  const name = readText(formData, "teacherName");
  const email = readText(formData, "teacherEmail").toLowerCase();
  const specialty = readOptionalText(formData, "specialty");

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { schoolId: school.id, name, email, role: "TEACHER" },
    });

    await tx.teacher.create({
      data: {
        schoolId: school.id,
        userId: user.id,
        name,
        email,
        phone: readOptionalText(formData, "teacherPhone"),
        nip: readOptionalText(formData, "nip"),
        specialty,
      },
    });
  });

  revalidatePath("/");
}

export async function createClass(formData: FormData) {
  const { school, academicYear } = await getSchoolContext();
  const homeroomTeacherId = readOptionalText(formData, "homeroomTeacherId");

  await prisma.schoolClass.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      homeroomTeacherId,
      name: readText(formData, "className").toUpperCase(),
      gradeLevel: readNumber(formData, "gradeLevel"),
      major: readOptionalText(formData, "major"),
      capacity: readNumber(formData, "capacity"),
    },
  });

  revalidatePath("/");
}

export async function createStudent(formData: FormData) {
  const { school } = await getSchoolContext();
  const name = readText(formData, "studentName");
  const nis = readText(formData, "nis");
  const classId = readText(formData, "classId");

  await prisma.$transaction(async (tx) => {
    const guardian = await tx.guardian.create({
      data: {
        schoolId: school.id,
        name: readText(formData, "guardianName"),
        phone: readText(formData, "guardianPhone"),
        email: readOptionalText(formData, "guardianEmail"),
        occupation: readOptionalText(formData, "guardianOccupation"),
      },
    });

    const user = await tx.user.create({
      data: {
        schoolId: school.id,
        name,
        email: `${nis.toLowerCase()}@siswa.gentosai.local`,
        role: "STUDENT",
      },
    });

    const student = await tx.student.create({
      data: {
        schoolId: school.id,
        userId: user.id,
        guardianId: guardian.id,
        nis,
        nisn: readOptionalText(formData, "nisn"),
        name,
        gender: readText(formData, "gender"),
        birthPlace: readText(formData, "birthPlace"),
        birthDate: readDate(formData, "birthDate"),
        address: readText(formData, "address"),
        status: "ACTIVE",
      },
    });

    await tx.classMembership.create({ data: { classId, studentId: student.id } });
  });

  revalidatePath("/");
}

export async function recordAttendance(formData: FormData) {
  const [studentId, classId] = readText(formData, "attendanceStudentRef").split(":");
  const date = readDate(formData, "attendanceDate");
  const status = readText(formData, "attendanceStatus") as AttendanceStatus;

  if (!studentId || !classId) {
    throw new Error("Siswa dan kelas absensi tidak valid");
  }

  await prisma.attendance.upsert({
    where: { studentId_classId_date: { studentId, classId, date } },
    update: { status, note: readOptionalText(formData, "attendanceNote") },
    create: {
      studentId,
      classId,
      date,
      status,
      note: readOptionalText(formData, "attendanceNote"),
    },
  });

  revalidatePath("/");
}

export async function createGrade(formData: FormData) {
  const { semester } = await getSchoolContext();
  const studentId = readText(formData, "gradeStudentId");
  const subjectId = readText(formData, "subjectId");
  const teacherId = readText(formData, "gradeTeacherId");

  await prisma.grade.create({
    data: {
      studentId,
      subjectId,
      teacherId,
      semesterId: semester.id,
      assessment: readText(formData, "assessment"),
      score: readNumber(formData, "score"),
      weight: readNumber(formData, "weight"),
    },
  });

  revalidatePath("/");
}

export async function createInvoice(formData: FormData) {
  const { school } = await getSchoolContext();
  const studentId = readText(formData, "invoiceStudentId");
  const classId = readOptionalText(formData, "invoiceClassId");
  const dueDate = readDate(formData, "dueDate");
  const amount = readNumber(formData, "amount");
  const status: PaymentStatus = dueDate < new Date() ? "OVERDUE" : "UNPAID";

  await prisma.invoice.create({
    data: {
      schoolId: school.id,
      studentId,
      classId,
      title: readText(formData, "invoiceTitle"),
      amount,
      dueDate,
      status,
    },
  });

  revalidatePath("/");
}

export async function recordPayment(formData: FormData) {
  const invoiceId = readText(formData, "paymentInvoiceId");
  const amount = readNumber(formData, "paymentAmount");
  const paidAt = readDate(formData, "paidAt");

  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    const paidAmount = Math.min(invoice.amount, invoice.paidAmount + amount);
    const status: PaymentStatus = paidAmount >= invoice.amount ? "PAID" : "PARTIAL";

    await tx.payment.create({
      data: {
        invoiceId,
        amount,
        paidAt,
        method: readText(formData, "paymentMethod"),
        reference: readOptionalText(formData, "paymentReference"),
      },
    });

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { paidAmount, status },
    });
  });

  revalidatePath("/");
}
