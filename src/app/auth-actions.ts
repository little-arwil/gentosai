"use server";

import { redirect } from "next/navigation";
import { createSession, destroyCurrentSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function readText(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() ?? "";
}

export async function login(formData: FormData) {
  const email = readText(formData, "email").toLowerCase();
  const password = readText(formData, "password");

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    redirect("/login?error=invalid");
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroyCurrentSession();
  redirect("/login");
}
