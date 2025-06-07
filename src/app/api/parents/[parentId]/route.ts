// src/app/api/parents/[parentId]/route.ts
// Force Node.js runtime so Prisma + jsonwebtoken work
export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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

export async function DELETE(
  request: Request,
  { params }: { params: { parentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, get all children associated with this parent
    const parent = await prisma.parent.findUnique({
      where: { id: params.parentId },
      include: {
        children: {
          include: {
            child: {
              include: {
                parents: true,
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Delete all children that only have this parent
    for (const pc of parent.children) {
      if (pc.child.parents.length === 1) {
        await prisma.child.delete({
          where: { id: pc.child.id },
        });
      }
    }

    // Delete the parent
    await prisma.parent.delete({
      where: { id: params.parentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting parent:", error);
    return NextResponse.json(
      { error: "Failed to delete parent" },
      { status: 500 }
    );
  }
}
