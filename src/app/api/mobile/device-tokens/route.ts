import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const deviceTokenSchema = z.object({
  parentId: z.string().min(1, "parentId is required"),
  deviceToken: z.string().min(1, "deviceToken is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { parentId, deviceToken } = deviceTokenSchema.parse(body);

    // Upsert device token based on parentId and deviceToken
    const tokenRecord = await prisma.deviceToken.upsert({
      where: {
        deviceToken: deviceToken,
      },
      update: {
        parentId,
      },
      create: {
        parentId,
        deviceToken,
      },
    });

    return NextResponse.json({ success: true, tokenRecord });
  } catch (error) {
    console.error("[DEVICE_TOKEN] Error registering device token:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to register device token" }, { status: 500 });
  }
} 