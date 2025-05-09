import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  organizationId: z.string().min(1, "Organization is required"),
  membershipId: z.string().optional(),
  role: z.enum(["PARENT", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: validatedData.organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // If organization requires membership ID and user is a parent
    if (organization.membershipIdRequired && 
        validatedData.role === "PARENT" && 
        !validatedData.membershipId) {
      return NextResponse.json(
        { error: "Membership ID is required for this organization" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12);

    // Create user and parent record in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          role: validatedData.role,
        },
      });

      // Create parent record if role is PARENT
      if (validatedData.role === "PARENT") {
        await tx.parent.create({
          data: {
            userId: user.id,
            organizationId: validatedData.organizationId,
            membershipId: validatedData.membershipId,
          },
        });
      }

      return user;
    });

    // Return success without sending the password
    const { password: _, ...userWithoutPassword } = result;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
} 