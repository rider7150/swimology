import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const classLevelSchema = z.object({
  name: z.string().min(1, "Level name is required"),
  description: z.string().optional(),
  sortOrder: z.number().min(0, "Order must be a positive number"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  color: z.string().min(1, "Color is required"),
});

async function checkPermissions(userId: string, organizationId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return false;
  }

  if (user.role === "SUPER_ADMIN") {
    return true;
  }

  const admin = await prisma.admin.findFirst({
    where: {
      userId: user.id,
      organizationId,
    },
  });

  return !!admin;
}

export async function POST(
  req: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasPermission = await checkPermissions(session.user.id, params.organizationId);
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Only administrators can manage class levels" },
        { status: 403 }
      );
    }

    const json = await req.json();
    const body = classLevelSchema.parse(json);

    const classLevel = await prisma.classLevel.create({
      data: {
        name: body.name,
        description: body.description,
        sortOrder: body.sortOrder,
        capacity: body.capacity,
        color: body.color,
        organizationId: params.organizationId,
      },
    });

    return NextResponse.json(classLevel);
  } catch (error) {
    console.error("Error creating class level:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { error: message },
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

    const classLevels = await prisma.classLevel.findMany({
      where: {
        organizationId: params.organizationId,
      },
      orderBy: {
        sortOrder: "asc",
      },
      include: {
        _count: {
          select: {
            skills: true,
            lessons: true,
          },
        },
      },
    });

    return NextResponse.json(classLevels);
  } catch (error) {
    console.error("Error fetching class levels:", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
} 