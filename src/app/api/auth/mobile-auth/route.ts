export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePasswords } from "@/lib/passwords";
import * as jose from 'jose';

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
      password: true,
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

  // Create a TextEncoder for the secret
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);

  // Sign the JWT using jose
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('next-auth')
    .setAudience('authenticated')
    .setExpirationTime('7d')
    .sign(secret);

  return NextResponse.json({ token, ...payload });
}