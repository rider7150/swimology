import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { parentId: string, notificationId: string } }
) {
  try {
    await prisma.notification.delete({
      where: { id: params.notificationId, parentId: params.parentId }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { parentId: string, notificationId: string } }
) {
  try {
    const { read } = await req.json();
    await prisma.notification.update({
      where: { id: params.notificationId, parentId: params.parentId },
      data: { read }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notification status" }, { status: 500 });
  }
} 