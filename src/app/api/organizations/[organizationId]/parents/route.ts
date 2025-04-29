import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

interface ParentUser {
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
}

interface ParentChild {
  enrollments: Array<{
    id: string;
    lessonId: string;
    childId: string;
  }>;
}

interface ParentWithRelations {
  id: string;
  user: ParentUser | null;
  children: ParentChild[];
}

export async function GET(
  request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const parents = await prisma.parent.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        children: {
          include: {
            enrollments: true,
          },
        },
      },
    });

    const result = parents.map((parent: ParentWithRelations) => ({
      id: parent.id,
      name: parent.user?.name || "",
      email: parent.user?.email || "",
      phone: parent.user?.phoneNumber || "",
      childrenCount: parent.children.length,
      enrollmentsCount: parent.children.reduce((acc: number, child: { enrollments: any[] }) => 
        acc + child.enrollments.length, 0),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching parents for organization:", error);
    return NextResponse.json(
      { error: "Failed to fetch parents" },
      { status: 500 }
    );
  }
}

interface UpdateParentData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
}

export async function PUT(
  request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const data: UpdateParentData = await request.json();
    
    // Update the user info for the parent
    const parent = await prisma.parent.findUnique({
      where: { id: data.id },
      include: { user: true },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Parent not found" },
        { status: 404 }
      );
    }

    const updateData = {
      name: data.name,
      email: data.email,
      phoneNumber: data.phone,
      ...(data.password && { password: await bcrypt.hash(data.password, 10) })
    } as const;

    await prisma.user.update({
      where: { id: parent.userId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating parent:", error);
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update parent" },
      { status: 500 }
    );
  }
} 