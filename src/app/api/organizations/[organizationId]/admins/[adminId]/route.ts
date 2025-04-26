import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function DELETE(
  req: Request,
  { params }: { params: { organizationId: string; adminId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (!user || (user.role !== "SUPER_ADMIN" && 
        (user.role !== "ADMIN" || user.organizationId !== params.organizationId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: params.adminId },
      include: { user: true },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (admin.organizationId !== params.organizationId) {
      return NextResponse.json(
        { error: "Admin does not belong to this organization" },
        { status: 400 }
      );
    }

    // Delete the admin record first, which will cascade delete the user record
    await prisma.admin.delete({
      where: { id: params.adminId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return NextResponse.json(
      { error: "Failed to remove admin" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { organizationId: string; adminId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (!user || (user.role !== "SUPER_ADMIN" && 
        (user.role !== "ADMIN" || user.organizationId !== params.organizationId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: params.adminId },
      include: { user: true },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (admin.organizationId !== params.organizationId) {
      return NextResponse.json(
        { error: "Admin does not belong to this organization" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, email, password } = body;

    // Update the user record
    const updateData: any = {
      name,
      email,
    };

    // Only update password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Update the user record
    await prisma.user.update({
      where: { id: admin.user.id },
      data: updateData,
    });

    // Get the updated admin record
    const updatedAdmin = await prisma.admin.findUnique({
      where: { id: params.adminId },
      include: {
        user: true,
      },
    });

    return NextResponse.json(updatedAdmin);
  } catch (error) {
    console.error("Error updating admin:", error);
    return NextResponse.json(
      { error: "Failed to update admin" },
      { status: 500 }
    );
  }
} 