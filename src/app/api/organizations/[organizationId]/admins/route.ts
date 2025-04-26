import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwords";
import * as z from "zod";

const adminSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(
  req: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = adminSchema.parse(json);

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(body.password);

    const admin = await prisma.admin.create({
      data: {
        organization: {
          connect: { id: params.organizationId },
        },
        user: {
          create: {
            name: body.name,
            email: body.email,
            password: hashedPassword,
            role: "ADMIN",
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(admin);
  } catch (error) {
    console.error("Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
    });
    
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json(
        { error: "Failed to add admin", details: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { organizationId: string; adminId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: params.adminId },
      include: { user: true },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Delete the user and the admin record (cascade delete will handle the admin record)
    await prisma.user.delete({
      where: { id: admin.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove admin" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is authorized to view admins
    if (session.user.role !== "SUPER_ADMIN") {
      const isOrgAdmin = await prisma.admin.findFirst({
        where: {
          userId: session.user.id,
          organizationId: params.organizationId,
        },
      });

      if (!isOrgAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const admins = await prisma.admin.findMany({
      where: {
        organizationId: params.organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(admins);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch admins" },
      { status: 500 }
    );
  }
} 