import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
    const result = parents.map((parent: any) => ({
      id: parent.id,
      name: parent.user?.name || "",
      email: parent.user?.email || "",
      phone: parent.user?.phoneNumber || "",
      childrenCount: parent.children.length,
      enrollmentsCount: parent.children.reduce((acc: number, child: any) => acc + child.enrollments.length, 0),
    }));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching parents for organization:", error);
    return NextResponse.json({ error: "Failed to fetch parents" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { id, name, email, phone, password } = await request.json();
    // Update the user info for the parent
    const parent = await prisma.parent.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }
    const updateData: any = {
      name,
      email,
      phoneNumber: phone,
    };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    await prisma.user.update({
      where: { id: parent.userId },
      data: updateData,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating parent:", error);
    return NextResponse.json({ error: "Failed to update parent" }, { status: 500 });
  }
} 