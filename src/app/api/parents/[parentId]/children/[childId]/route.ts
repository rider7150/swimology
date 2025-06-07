import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { parentId: string, childId: string } }
) {
  try {
    const { parentId, childId } = params;
    await prisma.parentChild.delete({
      where: {
        parentId_childId: {
          parentId,
          childId,
        },
      },
    });
    return NextResponse.json({ message: "Parent-child association removed." });
  } catch (error) {
    console.error("Error removing parent-child association:", error);
    return NextResponse.json({ error: "Failed to remove parent-child association" }, { status: 500 });
  }
} 