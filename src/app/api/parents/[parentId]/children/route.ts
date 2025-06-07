import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Get all children for a parent
export async function GET(
  request: Request,
  { params }: { params: { parentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parent = await prisma.parent.findUnique({
      where: { id: params.parentId },
      include: {
        children: {
          include: {
            child: true,
          },
        },
      },
    });
    //console.log("parent", parent);  

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }
//    console.log(parent);
    const children = parent.children.map((pc) => ({
      id: pc.child.id,
      name: pc.child.name,
      birthDate: pc.child.birthDate,
    }));

    return NextResponse.json(children);
  } catch (error) {
    console.error("Error fetching children:", error);
    return NextResponse.json(
      { error: "Failed to fetch children" },
      { status: 500 }
    );
  }
}

// Add a child to a parent
export async function POST(
  request: Request,
  { params }: { params: { parentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // If childId is provided, associate an existing child
    if (data.childId) {
      const parentChild = await prisma.parentChild.create({
        data: {
          parentId: params.parentId,
          childId: data.childId,
        },
        include: {
          child: true,
        },
      });

      return NextResponse.json(parentChild.child);
    }

    // Otherwise, create a new child
    const { name, birthDate } = data;

    // Create the child and associate it with the parent in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the child
      const child = await tx.child.create({
        data: {
          name,
          birthDate: new Date(birthDate),
        },
      });

      // Create the parent-child relationship
      await tx.parentChild.create({
        data: {
          parentId: params.parentId,
          childId: child.id,
        },
      });

      return child;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error adding child:", error);
    return NextResponse.json(
      { error: "Failed to add child" },
      { status: 500 }
    );
  }
}

// Remove a child from a parent
export async function DELETE(
  request: Request,
  { params }: { params: { parentId: string, childId: string } }
) {
  try {
    const { parentId, childId } = params;
    // Remove only the ParentChild association, not the child itself
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