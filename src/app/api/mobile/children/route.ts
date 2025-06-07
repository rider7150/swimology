import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as jose from 'jose';
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const childSchema = z.object({
  name: z.string().min(1, "Name is required"),
  birthDate: z.string(),
  lessonId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // Get the JWT token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    let parentId: string | undefined;
    try {
      // Verify the JWT token
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
      const { payload } = await jose.jwtVerify(token, secret);
      parentId = payload.parentId as string;
      if (!parentId) {
        return NextResponse.json({ error: "Invalid token: missing parentId" }, { status: 401 });
      }
    } catch (error) {
      console.error("JWT verification error:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const body = await request.json();
    const validatedData = childSchema.parse(body);
    let instructorName = null;
    // Create the child record and ParentChild join (and enrollment if lessonId is provided)
    const child = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newChild = await tx.child.create({
        data: {
          name: validatedData.name,
          birthDate: new Date(validatedData.birthDate),
        },
      });
      // Create the ParentChild join
      await tx.parentChild.create({
        data: {
          parentId,
          childId: newChild.id,
        },
      });
      if (validatedData.lessonId) {
        const lesson = await tx.lesson.findUnique({
          where: { id: validatedData.lessonId },
          include: { classLevel: { include: { skills: true } }, instructor: { include: { user: true } } },
        });
        if (!lesson) {
          throw new Error("Lesson not found");
        }
        instructorName = lesson.instructor?.user?.name || null;
        // Check if child is already enrolled in a class of the same level
        const existingEnrollment = await tx.enrollment.findFirst({
          where: {
            childId: newChild.id,
            lesson: {
              classLevelId: lesson.classLevelId,
              endDate: {
                gte: new Date(),
              },
            },
          },
        });
        if (existingEnrollment) {
          throw new Error("Child is already enrolled in a class of this level");
        }
        const enrollment = await tx.enrollment.create({
          data: {
            childId: newChild.id,
            lessonId: validatedData.lessonId,
            startDate: lesson.startDate,
            endDate: lesson.endDate,
          },
        });
        // Create SkillProgress for all skills in the class level
        for (const skill of lesson.classLevel.skills) {
          await tx.skillProgress.create({
            data: {
              skillId: skill.id,
              enrollmentId: enrollment.id,
              status: "NOT_STARTED",
            },
          });
        }
      }
      return newChild;
    });
    const confirmation = {
      message: `Your swimmer, ${child.name}, has been added.${instructorName ? ` Let ${instructorName} know to update the swimmer's progress` : ''}`,
      child
    };
    return NextResponse.json(confirmation);
  } catch (error) {
    console.error("Error adding child (mobile):", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to add child" },
      { status: 500 }
    );
  }
} 