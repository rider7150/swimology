import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as jose from 'jose';

export async function GET(
  request: Request,
  { params }: { params: { parentId: string } }
) {
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
      const { payload } = await jose.jwtVerify(token, secret);

      // Check if the token's parentId matches the requested parentId
      if (payload.parentId !== params.parentId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Get all enrollments for this parent's children
      const enrollments = await prisma.enrollment.findMany({
        where: {
          child: {
            parents: {
              some: {
                parentId: params.parentId
              }
            }
          }
        },
        include: {
          child: true,
          lesson: {
            include: {
              classLevel: true,
              skills: true
            }
          },
          progress: true
        },
        orderBy: {
          startDate: 'desc'
        }
      });

      // Transform the data for the mobile app
      const transformedEnrollments = await Promise.all(enrollments.map(async (e) => ({
        id: e.id,
        child: {
          id: e.child.id,
          name: e.child.name,
          birthDate: e.child.birthDate.toISOString()
        },
        lesson: {
          id: e.lesson.id,
          dayOfWeek: e.lesson.dayOfWeek,
          startTime: e.lesson.startTime.toISOString(),
          endTime: e.lesson.endTime.toISOString(),
          classLevel: {
            id: e.lesson.classLevel.id,
            name: e.lesson.classLevel.name,
            description: e.lesson.classLevel.description,
            capacity: e.lesson.classLevel.capacity,
            sortOrder: e.lesson.classLevel.sortOrder,
            color: e.lesson.classLevel.color
          },
          progress: await Promise.all(e.progress.map(async p => {
            let skill = e.lesson.skills.find(s => s.id === p.skillId);
            if (!skill) {
              skill = await prisma.skill.findUnique({ where: { id: p.skillId } }) || undefined;
            }
            return {
              id: p.id,
              skillId: p.skillId,
              status: p.status,
              notes: p.notes,
              name: skill ? skill.name : null,
              description: skill ? skill.description : null
            };
          })),
          skills: e.lesson.skills.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
            status: "NOT_STARTED",
            notes: null
          })),
          strengthNotes: e.strengthNotes,
          improvementNotes: e.improvementNotes,
          readyForNextLevel: e.readyForNextLevel === true
        }
      })));

      return NextResponse.json(transformedEnrollments);
    } catch (error) {
      console.error("JWT verification error:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
} 