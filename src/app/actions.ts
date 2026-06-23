"use server";

import { revalidatePath } from "next/cache";
import type { AttendanceStatus, PaymentStatus } from "@prisma/client";
import { hashPassword, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_NEW_USER_PASSWORD = "password123";
const MANAGE_MASTER_ROLES = ["SUPER_ADMIN", "PRINCIPAL", "ADMIN"] as const;
const ACADEMIC_ROLES = ["SUPER_ADMIN", "PRINCIPAL", "ADMIN", "TEACHER", "HOMEROOM"] as const;
const FINANCE_ROLES = ["SUPER_ADMIN", "PRINCIPAL", "ADMIN", "FINANCE"] as const;

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

async function getSchoolContext(schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
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

export async function createTeacher(formData: FormData) {
  const actor = await requireRole([...MANAGE_MASTER_ROLES]);
  const { school } = await getSchoolContext(actor.schoolId);
  const name = readText(formData, "teacherName");
  const email = readText(formData, "teacherEmail").toLowerCase();
  const specialty = readOptionalText(formData, "specialty");

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        schoolId: school.id,
        name,
        email,
        role: "TEACHER",
        passwordHash: hashPassword(DEFAULT_NEW_USER_PASSWORD),
      },
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
  const actor = await requireRole([...MANAGE_MASTER_ROLES]);
  const { school, academicYear } = await getSchoolContext(actor.schoolId);
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
  const actor = await requireRole([...MANAGE_MASTER_ROLES]);
  const { school } = await getSchoolContext(actor.schoolId);
  const name = readText(formData, "studentName");
  const nis = readText(formData, "nis");
  const classId = readText(formData, "classId");
  const guardianName = readText(formData, "guardianName");
  const guardianEmail = readOptionalText(formData, "guardianEmail");

  await prisma.$transaction(async (tx) => {
    const guardianUser = guardianEmail
      ? await tx.user.create({
          data: {
            schoolId: school.id,
            name: guardianName,
            email: guardianEmail.toLowerCase(),
            role: "GUARDIAN",
            passwordHash: hashPassword(DEFAULT_NEW_USER_PASSWORD),
          },
        })
      : null;

    const guardian = await tx.guardian.create({
      data: {
        schoolId: school.id,
        userId: guardianUser?.id,
        name: guardianName,
        phone: readText(formData, "guardianPhone"),
        email: guardianEmail,
        occupation: readOptionalText(formData, "guardianOccupation"),
      },
    });

    const user = await tx.user.create({
      data: {
        schoolId: school.id,
        name,
        email: `${nis.toLowerCase()}@siswa.gentosai.local`,
        role: "STUDENT",
        passwordHash: hashPassword(DEFAULT_NEW_USER_PASSWORD),
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
  await requireRole([...ACADEMIC_ROLES]);
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
  const actor = await requireRole([...ACADEMIC_ROLES]);
  const { semester } = await getSchoolContext(actor.schoolId);
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
  const actor = await requireRole([...FINANCE_ROLES]);
  const { school } = await getSchoolContext(actor.schoolId);
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
  await requireRole([...FINANCE_ROLES]);
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
