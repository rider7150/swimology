import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { parentId: string } }
) {
  try {
    await prisma.notification.updateMany({
      where: { parentId: params.parentId, read: false },
      data: { read: true }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
} 