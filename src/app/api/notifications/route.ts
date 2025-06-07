import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { parentId, childId, message } = body;

  if (!parentId || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const notification = await prisma.notification.create({
    data: {
      parentId,
      childId,
      message,
      read: false,
    },
  });

  return NextResponse.json(notification);
} 