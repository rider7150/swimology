import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as jose from 'jose';

// GET /api/mobile/lessons
export async function GET(request: Request) {
  try {
    // Get the JWT token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    try {
      // Verify the JWT token
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
      await jose.jwtVerify(token, secret);

      // Return all upcoming lessons (for adding a child)
      const lessons = await prisma.lesson.findMany({
        where: {
          endDate: {
            gte: new Date(),
          },
        },
        include: {
          classLevel: {
            include: {
              skills: true,
            },
          },
          instructor: {
            include: {
              user: true,
            },
          },
        },
        orderBy: [
          { startDate: 'asc' },
          { dayOfWeek: 'asc' },
        ],
      });

      // Transform data for mobile app
      const transformedLessons = lessons.map((lesson: any) => ({
        id: lesson.id,
        startDate: lesson.startDate,
        endDate: lesson.endDate,
        dayOfWeek: lesson.dayOfWeek,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        classLevel: {
          id: lesson.classLevel.id,
          name: lesson.classLevel.name,
          color: lesson.classLevel.color,
          skills: (lesson.classLevel.skills || []).map((skill: any) => ({
            id: skill.id,
            name: skill.name,
            description: skill.description,
          })),
        },
        instructor: {
          user: {
            name: lesson.instructor.user.name,
          },
        },
      }));

      return NextResponse.json(transformedLessons);
    } catch (error) {
      console.error("JWT verification error:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
} 