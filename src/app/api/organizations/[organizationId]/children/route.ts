import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all children in the organization
    const children = await prisma.child.findMany({
      include: {
        parents: {
          include: {
            parent: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // Map the children to include parent information
    const mappedChildren = children.map((child) => ({
      id: child.id,
      name: child.name,
      birthDate: child.birthDate,
      parents: child.parents.map((pc: any) => ({
        id: pc.parent.id,
        name: pc.parent.user?.name || "",
      })),
    }));

    return NextResponse.json(mappedChildren);
  } catch (error) {
    console.error("Error fetching children:", error);
    return NextResponse.json(
      { error: "Failed to fetch children" },
      { status: 500 }
    );
  }
} 