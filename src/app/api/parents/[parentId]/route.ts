// src/app/api/parents/[parentId]/route.ts
// Force Node.js runtime so Prisma + jsonwebtoken work
export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const SECRET = process.env.NEXTAUTH_SECRET!;

export async function GET(
  req: NextRequest,
  { params }: { params: { parentId: string } }
) {
  // 1) Inline JWT check
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  const token = auth.slice(7);
  try {
    jwt.verify(token, SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // 2) Fetch parent + children
  const parent = await prisma.parent.findUnique({
    where: { id: params.parentId },
    include: { children: true },
  });
  if (!parent) {
    return NextResponse.json({ error: "Parent not found" }, { status: 404 });
  }

  return NextResponse.json(parent);
}