import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the child first to verify it exists
    const child = await prisma.child.findUnique({
      where: { id: params.id },
    });

    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // Get all parent links for this child
    const parentLinks = await prisma.parentChild.findMany({
      where: { childId: params.id },
      include: {
        parent: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Format the response to return parent details
    const parents = parentLinks.map((link) => ({
      id: link.parent.id,
      name: link.parent.user?.name || "",
      email: link.parent.user?.email || "",
    }));

    return NextResponse.json(parents);
  } catch (error) {
    console.error("Error fetching parents for child:", error);
    return NextResponse.json(
      { error: "Failed to fetch parents" },
      { status: 500 }
    );
  }
} 