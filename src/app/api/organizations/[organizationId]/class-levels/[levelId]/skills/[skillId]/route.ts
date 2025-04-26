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

export async function PUT(
  req: Request,
  { params }: { params: { organizationId: string; levelId: string; skillId: string } }
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

    const skill = await prisma.skill.update({
      where: {
        id: params.skillId,
        classLevelId: params.levelId,
      },
      data: {
        name: body.name,
        description: body.description,
      },
    });

    return NextResponse.json(skill);
  } catch (error) {
    console.error("Error updating skill:", error);
    
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

export async function DELETE(
  request: Request,
  { params }: { params: { organizationId: string; levelId: string; skillId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { organizationId, levelId, skillId } = params;

    // Check if the class level exists and belongs to the organization
    const classLevel = await prisma.classLevel.findUnique({
      where: {
        id: levelId,
        organizationId: organizationId,
      },
    });

    if (!classLevel) {
      return new NextResponse("Class level not found", { status: 404 });
    }

    // Delete the skill
    await prisma.skill.delete({
      where: {
        id: skillId,
        classLevelId: levelId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[SKILL_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 