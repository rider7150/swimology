import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import * as z from "zod";

const skillSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  description: z.string().optional(),
});

async function checkPermissions(userId: string, organizationId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return false;
  }

  if (user.role === UserRole.SUPER_ADMIN) {
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
  { params }: { params: { organizationId: string; levelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasPermission = await checkPermissions(session.user.id, params.organizationId);
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Only administrators can manage skills" },
        { status: 403 }
      );
    }

    const json = await req.json();
    const body = skillSchema.parse(json);

    const skill = await prisma.skill.create({
      data: {
        name: body.name,
        description: body.description,
        classLevelId: params.levelId,
      },
    });

    return NextResponse.json(skill);
  } catch (error) {
    console.error("Error creating skill:", error);
    
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
  { params }: { params: { organizationId: string; levelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const skills = await prisma.skill.findMany({
      where: {
        classLevelId: params.levelId,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(skills);
  } catch (error) {
    console.error("Error fetching skills:", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
} 