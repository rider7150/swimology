import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";

const registrationSchema = {
  name: "string",
  email: "string",
  password: "string",
  organizationId: "string",
  membershipId: "string?",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const { name, email, password, organizationId, membershipId } = body;
    if (!name || !email || !password || !organizationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Check if organization exists and requires membership ID
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    if (organization.membershipIdRequired && !membershipId) {
      return NextResponse.json(
        { error: "Membership ID is required for this organization" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user and parent in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "PARENT",
        },
      });

      // Create parent
      const parent = await tx.parent.create({
        data: {
          organizationId,
          userId: user.id,
          membershipId,
        },
      });

      return { user, parent };
    });

    // Generate JWT token
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error("JWT secret is not set");
    }
    const token = sign(
      {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        parentId: result.parent.id,
      },
      secret,
      { expiresIn: "7d" }
    );

    console.log("Registration successful, sending response:", {
      token,
      parentId: result.parent.id,
      name: result.user.name,
    });
    return NextResponse.json({
      token,
      parentId: result.parent.id,
      name: result.user.name,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register" },
      { status: 500 }
    );
  }
} 