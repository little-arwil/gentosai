const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const daysFromNow = (days) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

const time = (hour, minute = 0) => `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

async function reset() {
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.reportCard.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.teachingAssignment.deleteMany();
  await prisma.classMembership.deleteMany();
  await prisma.studentNote.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.schoolClass.deleteMany();
  await prisma.student.deleteMany();
  await prisma.guardian.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();
}

async function main() {
  await reset();

  const school = await prisma.school.create({
    data: {
      name: "SMA Gentosai Nusantara",
      npsn: "GTN-2026",
      address: "Jl. Pendidikan No. 7",
      city: "Bandung",
      province: "Jawa Barat",
      phone: "022-555-0188",
      email: "halo@gentosai.sch.id",
    },
  });

  const academicYear = await prisma.academicYear.create({
    data: {
      schoolId: school.id,
      name: "2026/2027",
      startsAt: daysFromNow(-120),
      endsAt: daysFromNow(240),
      isActive: true,
    },
  });

  const semester = await prisma.semester.create({
    data: {
      academicYearId: academicYear.id,
      name: "Ganjil",
      startsAt: daysFromNow(-120),
      endsAt: daysFromNow(60),
      isActive: true,
    },
  });

  const principalUser = await prisma.user.create({
    data: {
      schoolId: school.id,
      name: "Dr. Rania Maheswari",
      email: "kepsek@gentosai.sch.id",
      role: "PRINCIPAL",
    },
  });

  await prisma.user.createMany({
    data: [
      { schoolId: school.id, name: "Admin Sekolah", email: "admin@gentosai.sch.id", role: "ADMIN" },
      { schoolId: school.id, name: "Nadia Keuangan", email: "finance@gentosai.sch.id", role: "FINANCE" },
      { schoolId: school.id, name: "Bima BK", email: "bk@gentosai.sch.id", role: "COUNSELOR" },
    ],
  });

  const teacherUsers = await Promise.all(
    [
      ["Maya Prameswari", "maya@gentosai.sch.id", "Matematika"],
      ["Arif Wibowo", "arif@gentosai.sch.id", "Bahasa Indonesia"],
      ["Dewi Larasati", "dewi@gentosai.sch.id", "IPA"],
      ["Raka Fadillah", "raka@gentosai.sch.id", "Sejarah"],
    ].map(([name, email]) =>
      prisma.user.create({ data: { schoolId: school.id, name, email, role: "TEACHER" } }),
    ),
  );

  const teachers = await Promise.all(
    [
      { user: teacherUsers[0], nip: "198901012026011001", specialty: "Matematika" },
      { user: teacherUsers[1], nip: "198706142026011002", specialty: "Bahasa Indonesia" },
      { user: teacherUsers[2], nip: "199104232026011003", specialty: "IPA Terpadu" },
      { user: teacherUsers[3], nip: "198812082026011004", specialty: "Sejarah Indonesia" },
    ].map(({ user, nip, specialty }) =>
      prisma.teacher.create({
        data: {
          schoolId: school.id,
          userId: user.id,
          nip,
          name: user.name,
          email: user.email,
          phone: "08" + Math.floor(1000000000 + Math.random() * 8999999999),
          specialty,
        },
      }),
    ),
  );

  const classes = await Promise.all([
    prisma.schoolClass.create({
      data: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        homeroomTeacherId: teachers[0].id,
        name: "X-A",
        gradeLevel: 10,
        major: "Umum",
        capacity: 32,
      },
    }),
    prisma.schoolClass.create({
      data: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        homeroomTeacherId: teachers[1].id,
        name: "X-B",
        gradeLevel: 10,
        major: "Umum",
        capacity: 32,
      },
    }),
  ]);

  const subjects = await prisma.subject.createManyAndReturn({
    data: [
      { schoolId: school.id, code: "MTK", name: "Matematika", group: "Wajib" },
      { schoolId: school.id, code: "BIN", name: "Bahasa Indonesia", group: "Wajib" },
      { schoolId: school.id, code: "IPA", name: "Ilmu Pengetahuan Alam", group: "Wajib" },
      { schoolId: school.id, code: "SEJ", name: "Sejarah", group: "Wajib" },
      { schoolId: school.id, code: "BIG", name: "Bahasa Inggris", group: "Wajib" },
    ],
  });

  const guardianData = [
    ["Siti Aminah", "081234500001", "Wiraswasta"],
    ["Hendra Saputra", "081234500002", "Karyawan"],
    ["Laras Ningsih", "081234500003", "Guru"],
    ["Taufik Rahman", "081234500004", "Pedagang"],
    ["Yuni Kartika", "081234500005", "Perawat"],
    ["Fajar Nugroho", "081234500006", "Teknisi"],
    ["Dian Permata", "081234500007", "Akuntan"],
    ["Agus Salim", "081234500008", "Petani"],
  ];

  const guardians = await Promise.all(
    guardianData.map(([name, phone, occupation], index) =>
      prisma.guardian.create({
        data: {
          schoolId: school.id,
          name,
          phone,
          email: `wali${index + 1}@example.com`,
          occupation,
        },
      }),
    ),
  );

  const studentRows = [
    ["GTS26001", "Alya Putri", "P", "Bandung", -5600, classes[0].id, guardians[0].id],
    ["GTS26002", "Bagas Pratama", "L", "Cimahi", -5520, classes[0].id, guardians[1].id],
    ["GTS26003", "Citra Lestari", "P", "Garut", -5480, classes[0].id, guardians[2].id],
    ["GTS26004", "Dimas Arya", "L", "Bandung", -5450, classes[0].id, guardians[3].id],
    ["GTS26005", "Elsa Maharani", "P", "Sumedang", -5410, classes[0].id, guardians[4].id],
    ["GTS26006", "Fikri Ramadhan", "L", "Tasikmalaya", -5570, classes[1].id, guardians[5].id],
    ["GTS26007", "Gita Anindya", "P", "Bandung", -5530, classes[1].id, guardians[6].id],
    ["GTS26008", "Hafiz Muttaqin", "L", "Cirebon", -5490, classes[1].id, guardians[7].id],
  ];

  const students = [];
  for (const [index, row] of studentRows.entries()) {
    const [nis, name, gender, birthPlace, birthOffset, classId, guardianId] = row;
    const user = await prisma.user.create({
      data: {
        schoolId: school.id,
        name,
        email: `${String(name).toLowerCase().replaceAll(" ", ".")}@siswa.gentosai.sch.id`,
        role: "STUDENT",
      },
    });

    const student = await prisma.student.create({
      data: {
        schoolId: school.id,
        userId: user.id,
        guardianId,
        nis,
        nisn: `009${260000 + index}`,
        name,
        gender,
        birthPlace,
        birthDate: daysFromNow(Number(birthOffset)),
        address: `Komplek Pelajar Blok ${String.fromCharCode(65 + index)}-${index + 1}`,
        status: "ACTIVE",
      },
    });

    await prisma.classMembership.create({ data: { classId, studentId: student.id } });
    students.push(student);
  }

  for (const classItem of classes) {
    await Promise.all(
      subjects.slice(0, 4).map((subject, index) =>
        prisma.teachingAssignment.create({
          data: {
            classId: classItem.id,
            subjectId: subject.id,
            teacherId: teachers[index % teachers.length].id,
          },
        }),
      ),
    );
  }

  await prisma.schedule.createMany({
    data: [
      { classId: classes[0].id, subjectId: subjects[0].id, teacherId: teachers[0].id, semesterId: semester.id, dayOfWeek: 1, startsAt: time(7), endsAt: time(8, 30), room: "R-10A" },
      { classId: classes[0].id, subjectId: subjects[1].id, teacherId: teachers[1].id, semesterId: semester.id, dayOfWeek: 1, startsAt: time(8, 45), endsAt: time(10, 15), room: "R-10A" },
      { classId: classes[0].id, subjectId: subjects[2].id, teacherId: teachers[2].id, semesterId: semester.id, dayOfWeek: 2, startsAt: time(7), endsAt: time(8, 30), room: "Lab IPA" },
      { classId: classes[1].id, subjectId: subjects[0].id, teacherId: teachers[0].id, semesterId: semester.id, dayOfWeek: 1, startsAt: time(10, 30), endsAt: time(12), room: "R-10B" },
      { classId: classes[1].id, subjectId: subjects[3].id, teacherId: teachers[3].id, semesterId: semester.id, dayOfWeek: 3, startsAt: time(9), endsAt: time(10, 30), room: "R-10B" },
    ],
  });

  const attendanceStatuses = ["PRESENT", "PRESENT", "PRESENT", "LATE", "ABSENT", "PRESENT", "SICK", "PERMIT"];
  for (const [index, student] of students.entries()) {
    const classId = index < 5 ? classes[0].id : classes[1].id;
    await prisma.attendance.create({
      data: {
        studentId: student.id,
        classId,
        date: daysFromNow(0),
        status: attendanceStatuses[index],
        note: attendanceStatuses[index] === "ABSENT" ? "Belum ada konfirmasi orang tua" : null,
      },
    });
    await prisma.attendance.create({
      data: {
        studentId: student.id,
        classId,
        date: daysFromNow(-1),
        status: index % 6 === 0 ? "LATE" : "PRESENT",
      },
    });
  }

  for (const [index, student] of students.entries()) {
    await prisma.grade.createMany({
      data: [
        { studentId: student.id, subjectId: subjects[0].id, teacherId: teachers[0].id, semesterId: semester.id, assessment: "Formatif 1", score: 72 + (index % 5) * 5, weight: 1 },
        { studentId: student.id, subjectId: subjects[1].id, teacherId: teachers[1].id, semesterId: semester.id, assessment: "Tugas Esai", score: 76 + (index % 4) * 4, weight: 1 },
        { studentId: student.id, subjectId: subjects[2].id, teacherId: teachers[2].id, semesterId: semester.id, assessment: "Praktikum", score: 70 + (index % 6) * 3, weight: 1.5 },
      ],
    });
  }

  for (const [index, student] of students.entries()) {
    const status = index % 4 === 0 ? "OVERDUE" : index % 3 === 0 ? "PARTIAL" : "PAID";
    const paidAmount = status === "PAID" ? 450000 : status === "PARTIAL" ? 200000 : 0;
    const invoice = await prisma.invoice.create({
      data: {
        schoolId: school.id,
        studentId: student.id,
        classId: index < 5 ? classes[0].id : classes[1].id,
        title: "SPP Januari 2027",
        amount: 450000,
        paidAmount,
        dueDate: daysFromNow(index % 4 === 0 ? -5 : 14),
        status,
      },
    });

    if (paidAmount > 0) {
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: paidAmount,
          paidAt: daysFromNow(-2),
          method: "Transfer Bank",
          reference: `TRX-GTS-${index + 1}`,
        },
      });
    }
  }

  await prisma.studentNote.createMany({
    data: [
      { studentId: students[1].id, category: "Prestasi", title: "Juara Olimpiade Matematika Internal", content: "Menjadi peringkat 1 seleksi internal sekolah.", points: 15 },
      { studentId: students[3].id, category: "Disiplin", title: "Terlambat 3 kali", content: "Perlu pemantauan wali kelas minggu ini.", points: -10 },
      { studentId: students[4].id, category: "BK", title: "Belum hadir tanpa kabar", content: "Hubungi orang tua untuk klarifikasi absensi.", points: -20 },
    ],
  });

  await prisma.announcement.createMany({
    data: [
      { schoolId: school.id, title: "Rapat Orang Tua Semester Ganjil", content: "Dilaksanakan Jumat pukul 14.00 di aula sekolah.", audience: "GUARDIAN" },
      { schoolId: school.id, title: "Pekan Projek Profil Pelajar", content: "Seluruh siswa kelas X menyiapkan proposal projek sebelum Senin.", audience: "STUDENT" },
      { schoolId: school.id, title: "Validasi Nilai Formatif", content: "Guru diminta melengkapi nilai formatif sampai akhir minggu.", audience: "TEACHER" },
    ],
  });

  for (const student of students.slice(0, 5)) {
    const grades = await prisma.grade.findMany({ where: { studentId: student.id } });
    const averageScore = grades.reduce((total, grade) => total + grade.score, 0) / grades.length;
    await prisma.reportCard.create({
      data: {
        studentId: student.id,
        semesterId: semester.id,
        averageScore,
        attendanceSummary: "Hadir baik, perlu konsistensi tepat waktu.",
        teacherNote: "Menunjukkan perkembangan positif dan aktif berdiskusi di kelas.",
      },
    });
  }

  console.log(`Seed completed for ${school.name}. Principal demo: ${principalUser.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
