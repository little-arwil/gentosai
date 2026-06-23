import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = (formData.get("email")?.toString() || "").toLowerCase().trim();
  const password = formData.get("password")?.toString() || "";

  if (!email || !password) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url));
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.redirect(new URL("/login?error=invalid", request.url));
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await createSession(user.id);

    return NextResponse.redirect(new URL("/", request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url));
  }
}
