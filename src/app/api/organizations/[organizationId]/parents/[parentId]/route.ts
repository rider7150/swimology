import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { organizationId: string; parentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parent = await prisma.parent.findUnique({
      where: {
        id: params.parentId,
        organizationId: params.organizationId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: parent.id,
      name: parent.user?.name || "",
      email: parent.user?.email || "",
      phone: parent.user?.phoneNumber || "",
    });
  } catch (error) {
    console.error("Error fetching parent:", error);
    return NextResponse.json(
      { error: "Failed to fetch parent" },
      { status: 500 }
    );
  }
} 