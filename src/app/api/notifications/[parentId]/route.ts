import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as jose from 'jose';

export async function GET(
  req: Request,
  { params }: { params: { parentId: string } }
) {
  // Try JWT auth (mobile)
  const authHeader = req.headers.get('Authorization');
  let parentIdFromAuth: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
      const { payload } = await jose.jwtVerify(token, secret);
      parentIdFromAuth = payload.parentId as string;
    } catch (e) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } else {
    // Try session auth (web)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Find parentId for this user
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id }
    });
    parentIdFromAuth = parent?.id ?? null;
  }

  if (!parentIdFromAuth || parentIdFromAuth !== params.parentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch notifications for this parent
  const notifications = await prisma.notification.findMany({
    where: { parentId: params.parentId },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(notifications);
} 