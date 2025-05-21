import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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