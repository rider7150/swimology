import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classLevelId = searchParams.get("classLevelId");
  if (!classLevelId) {
    return NextResponse.json({ error: "classLevelId is required" }, { status: 400 });
  }

  // Find all lessons for this class level, sorted by startDate
  const lessons = await prisma.lesson.findMany({
    where: { classLevelId },
    orderBy: { startDate: "asc" },
    include: {
      classLevel: true,
    },
  });

  return NextResponse.json(lessons);
} 