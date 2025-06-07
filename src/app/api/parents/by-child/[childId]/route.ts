import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { childId: string } }
) {
  try {
    const parentLinks = await prisma.parentChild.findMany({
      where: { childId: params.childId },
      select: { parentId: true }
    });
    const parentIds = parentLinks.map(link => link.parentId);
    return NextResponse.json({ parentIds });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch parent IDs" }, { status: 500 });
  }
} 