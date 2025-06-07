import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // For mobile registration, we do not require authentication
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        membershipIdRequired: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(organizations);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
} 