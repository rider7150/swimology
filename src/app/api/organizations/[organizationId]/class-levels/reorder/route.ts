import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reorderSchema = z.object({
  levels: z.array(z.object({
    id: z.string(),
    sortOrder: z.number(),
  })),
});

export async function POST(
  req: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Only administrators can manage class levels" },
        { status: 403 }
      );
    }

    // If user is an ADMIN, verify they belong to this organization
    if (user.role === "ADMIN") {
      const admin = await prisma.admin.findFirst({
        where: {
          userId: user.id,
          organizationId: params.organizationId,
        },
      });

      if (!admin) {
        return NextResponse.json(
          { error: "You can only manage class levels in your organization" },
          { status: 403 }
        );
      }
    }

    const json = await req.json();
    const body = reorderSchema.parse(json);

    // Update all levels in a transaction
    await prisma.$transaction(
      body.levels.map((level) =>
        prisma.classLevel.update({
          where: {
            id: level.id,
            organizationId: params.organizationId,
          },
          data: {
            sortOrder: level.sortOrder,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering class levels:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to reorder class levels" },
      { status: 500 }
    );
  }
} 