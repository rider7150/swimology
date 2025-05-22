export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePasswords } from "@/lib/passwords";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      password: true, // 👈 add this line
      parent: {
        include: { organization: true },
      },
      admin: {
        include: { organization: true },
      },
      instructor: {
        include: { organization: true },
      },
    }
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await comparePasswords(password, user.password);
    if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.parent?.organizationId || user.admin?.organizationId || user.instructor?.organizationId,
    parentId: user.parent?.id,
  };

  const token = jwt.sign(payload, process.env.NEXTAUTH_SECRET!, { expiresIn: "7d" });

  return NextResponse.json({ token, ...payload });
}