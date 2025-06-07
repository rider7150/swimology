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
    const enrollmentId = params.id;
    if (!enrollmentId) {
      return NextResponse.json({ error: "Enrollment ID is required" }, { status: 400 });
    }
    // Find the enrollment and check ownership (optional: add parent check if needed)
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { child: { include: { enrollments: true } } },
    });
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }
    // Optionally, check if the parent owns this child (for extra security)
    const parentChild = await prisma.parentChild.findFirst({
      where: { parentId, childId: enrollment.child.id },
    });
    if (!parentChild) {
      return NextResponse.json({ error: "You can only delete your own child's enrollments" }, { status: 403 });
    }
    // Delete all skill progress for this enrollment
    await prisma.skillProgress.deleteMany({ where: { enrollmentId } });
    // Delete the enrollment
    await prisma.enrollment.delete({ where: { id: enrollmentId } });
    // Check if the child has any other enrollments
    const remainingEnrollments = await prisma.enrollment.count({ where: { childId: enrollment.child.id } });
    if (remainingEnrollments === 0) {
      // Get all parents for this child
      const allParentJoins = await prisma.parentChild.findMany({ where: { childId: enrollment.child.id } });
      if (allParentJoins.length === 1) {
        // Only one parent, delete the child and all related records
        await prisma.$transaction(async (tx) => {
          // Delete ParentChild join
          await tx.parentChild.deleteMany({ where: { childId: enrollment.child.id } });
          // Delete the child
          await tx.child.delete({ where: { id: enrollment.child.id } });
        });
      } else {
        // More than one parent, just remove this parent's join
        await prisma.parentChild.delete({ where: { id: parentChild.id } });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting enrollment (mobile):", error);
    return NextResponse.json({ error: "Failed to delete enrollment" }, { status: 500 });
  }
} 