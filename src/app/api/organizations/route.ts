import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwords";
import * as z from "zod";

const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  membershipIdRequired: z.boolean().default(false),
  admin: z.object({
    name: z.string().min(1, "Admin name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only super admins can create organizations" },
        { status: 403 }
      );
    }

    const json = await req.json();
    const body = organizationSchema.parse(json);

    const existingUser = await prisma.user.findUnique({
      where: { email: body.admin.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(body.admin.password);

    const organization = await prisma.organization.create({
      data: {
        name: body.name,
        membershipIdRequired: body.membershipIdRequired,
        admins: {
          create: {
            user: {
              create: {
                name: body.admin.name,
                email: body.admin.email,
                password: hashedPassword,
                role: "ADMIN",
              },
            },
          },
        },
      },
      include: {
        admins: {
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
        },
      },
    });

    return NextResponse.json(organization);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only super admins can view all organizations" },
        { status: 403 }
      );
    }

    const organizations = await prisma.organization.findMany({
      include: {
        admins: {
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
        },
        classLevels: true,
      },
    });

    return NextResponse.json(organizations);
  } catch {
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 }
    );
  }
} 