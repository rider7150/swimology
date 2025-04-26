import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { hashPassword } from "@/lib/utils";

const instructorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  phoneNumber: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN)) {
      return NextResponse.json(
        { error: "Only administrators can manage instructors" },
        { status: 403 }
      );
    }

    const json = await request.json();
    const validatedData = instructorSchema.parse(json);

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Create user and instructor in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate a random password if none provided
      const password = validatedData.password || Math.random().toString(36).slice(-8);
      
      // Hash the password
      const hashedPassword = await hashPassword(password);

      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          role: UserRole.INSTRUCTOR,
        },
      });

      const instructor = await tx.instructor.create({
        data: {
          organizationId: params.organizationId,
          userId: user.id,
          phoneNumber: validatedData.phoneNumber,
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

      return instructor;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating instructor:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create instructor" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instructors = await prisma.instructor.findMany({
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
        lessons: {
          include: {
            classLevel: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(instructors);
  } catch (error) {
    console.error("Error fetching instructors:", error);
    return NextResponse.json(
      { error: "Failed to fetch instructors" },
      { status: 500 }
    );
  }
} 