import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as jose from 'jose';
import { Prisma, Parent, ParentChild, Child, Enrollment, Lesson, ClassLevel, SkillProgress, Skill } from "@prisma/client";

type ParentWithChildren = Parent & {
  children: (ParentChild & {
    child: Child & {
      enrollments: (Enrollment & {
        lesson: Lesson & {
          classLevel: ClassLevel;
          skills: Skill[];
        };
        progress: SkillProgress[];
      })[];
    };
  })[];
};

interface SkillResponse {
  id: string;
  name: string;
  description: string | null;
  status: string;
  notes: string | null;
}

interface ProgressResponse {
  id: string;
  skillId: string;
  status: string;
  notes: string | null;
}

interface ClassLevelResponse {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  sortOrder: number;
  color: string;
}

interface LessonResponse {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  classLevel: ClassLevelResponse;
  progress: ProgressResponse[];
  skills: SkillResponse[];
  strengthNotes: string | null;
  improvementNotes: string | null;
  readyForNextLevel: boolean;
}

interface ChildResponse {
  id: string;
  name: string;
  birthDate: string;
  lessons: LessonResponse[];
  strengthNotes: string | null;
  improvementNotes: string | null;
}

// Get all children for a parent (mobile endpoint)
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

      const parent = await prisma.parent.findUnique({
        where: { id: params.parentId },
        include: {
          children: {
            include: {
              child: {
                include: {
                  enrollments: {
                    include: {
                      lesson: {
                        include: {
                          classLevel: true,
                          skills: true
                        }
                      },
                      progress: true
                    }
                  }
                }
              },
            },
          },
        },
      });

      if (!parent) {
        return NextResponse.json({ error: "Parent not found" }, { status: 404 });
      }

      const children: ChildResponse[] = await Promise.all((parent as ParentWithChildren).children.map(async (pc) => ({
        id: pc.child.id,
        name: pc.child.name,
        birthDate: pc.child.birthDate.toISOString(),
        lessons: await Promise.all(pc.child.enrollments.map(async (e) => ({
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
            status: "NOT_STARTED", // Default status since we don't have it in the schema
            notes: null
          })),
          strengthNotes: e.strengthNotes,
          improvementNotes: e.improvementNotes,
          readyForNextLevel: e.readyForNextLevel === true
        }))),
        strengthNotes: null, // These would come from somewhere else in the schema
        improvementNotes: null
      })));

      return NextResponse.json(children);
    } catch (error) {
      console.error("JWT verification error:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error fetching children:", error);
    return NextResponse.json(
      { error: "Failed to fetch children" },
      { status: 500 }
    );
  }
} 