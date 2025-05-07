import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Class level ID is required" },
        { status: 400 }
      );
    }

    // Get the current class level
    const currentLevel = await prisma.classLevel.findUnique({
      where: { id },
    });

    if (!currentLevel) {
      return NextResponse.json(
        { error: "Class level not found" },
        { status: 404 }
      );
    }

    // Find the next level by sort order
    const nextLevel = await prisma.classLevel.findFirst({
      where: {
        organizationId: currentLevel.organizationId,
        sortOrder: {
          gt: currentLevel.sortOrder,
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    if (!nextLevel) {
      return NextResponse.json(
        { error: "No next level available" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: nextLevel.id,
      name: nextLevel.name,
      sortOrder: nextLevel.sortOrder,
      color: nextLevel.color,
    });
  } catch (error) {
    console.error("Error fetching next class level:", error);
    return NextResponse.json(
      { error: "Failed to fetch next class level" },
      { status: 500 }
    );
  }
} 