import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as jose from 'jose';

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
    const { childId, nextLessonId } = await request.json();
    if (!childId || !nextLessonId) {
      return NextResponse.json({ error: "childId and nextLessonId are required" }, { status: 400 });
    }
    // Get the next lesson and its class level
    const nextLesson = await prisma.lesson.findUnique({
      where: { id: nextLessonId },
      include: { classLevel: true },
    });
    if (!nextLesson) {
      return NextResponse.json({ error: "Next lesson not found" }, { status: 404 });
    }
    // Create the new enrollment
    const newEnrollment = await prisma.enrollment.create({
      data: {
        childId,
        lessonId: nextLessonId,
        startDate: nextLesson.startDate,
        endDate: nextLesson.endDate,
      },
    });
    // Find the most recent previous enrollment for this child
    const prevEnrollment = await prisma.enrollment.findFirst({
      where: {
        childId,
        id: { not: newEnrollment.id },
      },
      orderBy: { startDate: "desc" },
      include: { lesson: { include: { classLevel: true } }, progress: true },
    });
    let copied = false;
    if (prevEnrollment && prevEnrollment.lesson.classLevel.id === nextLesson.classLevel.id) {
      // Copy all SkillProgress details from previous enrollment
      for (const prog of prevEnrollment.progress) {
        await prisma.skillProgress.create({
          data: {
            skillId: prog.skillId,
            enrollmentId: newEnrollment.id,
            status: prog.status,
            notes: prog.notes
          },
        });
      }
      copied = true;
    }
    // If no previous enrollment, or previous enrollment is for a different class level, create SkillProgress for all skills in the new class level
    if (!copied) {
      const skills = await prisma.skill.findMany({
        where: { classLevelId: nextLesson.classLevel.id },
      });
      for (const skill of skills) {
        await prisma.skillProgress.create({
          data: {
            skillId: skill.id,
            enrollmentId: newEnrollment.id,
            status: "NOT_STARTED",
          },
        });
      }
    }
    return NextResponse.json(newEnrollment);
  } catch (error) {
    console.error("Error creating next enrollment (mobile):", error);
    return NextResponse.json({ error: "Failed to create next enrollment" }, { status: 500 });
  }
} 