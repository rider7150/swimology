import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const enrollmentId = params.id;
    if (!enrollmentId) {
      return NextResponse.json({ error: "Enrollment ID is required" }, { status: 400 });
    }
    // Find the enrollment and check ownership (optional: add parent check if needed)
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { child: true },
    });
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }
    // Optionally, check if the session user is the parent of the child
    // (Uncomment and adjust if you want to restrict deletion to the parent)
    // const parent = await prisma.parent.findFirst({ where: { userId: session.user.id } });
    // if (!parent || parent.id !== enrollment.child.parentId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // }
    // Delete all skill progress for this enrollment
    await prisma.skillProgress.deleteMany({ where: { enrollmentId } });
    // Delete the enrollment
    await prisma.enrollment.delete({ where: { id: enrollmentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting enrollment:", error);
    return NextResponse.json({ error: "Failed to delete enrollment" }, { status: 500 });
  }
} 