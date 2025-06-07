import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as jose from 'jose';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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
    // Get the ParentChild join for this parent and child
    const parentChild = await prisma.parentChild.findFirst({
      where: { parentId, childId: params.id },
    });
    if (!parentChild) {
      return NextResponse.json({ error: "You can only delete your own children" }, { status: 403 });
    }
    // Get all parents for this child
    const allParentJoins = await prisma.parentChild.findMany({
      where: { childId: params.id },
    });
    // Get the child with enrollments
    const child = await prisma.child.findUnique({
      where: { id: params.id },
      include: {
        enrollments: {
          include: {
            progress: true,
          },
        },
      },
    });
    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }
    if (allParentJoins.length === 1) {
      await prisma.$transaction(async (tx) => {
        // Delete all skill progress records for all enrollments
        if (child.enrollments.length > 0) {
          await tx.skillProgress.deleteMany({
            where: {
              enrollmentId: {
                in: child.enrollments.map((e) => e.id),
              },
            },
          });
        }
        // Delete all enrollments
        await tx.enrollment.deleteMany({
          where: { childId: child.id },
        });
        // Delete the ParentChild join
        await tx.parentChild.deleteMany({ where: { childId: child.id } });
        // Finally delete the child
        await tx.child.delete({ where: { id: child.id } });
      });
    } else {
      // Otherwise, just remove the ParentChild join
      await prisma.parentChild.delete({ where: { id: parentChild.id } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting child (mobile):", error);
    return NextResponse.json({ error: "Failed to delete child" }, { status: 500 });
  }
} 