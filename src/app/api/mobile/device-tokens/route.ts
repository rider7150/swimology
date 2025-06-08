import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as jose from 'jose';
import { z } from "zod";

const deviceTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
  deviceId: z.string().min(1, "Device ID is required"),
  platform: z.enum(["ios", "android"]).default("ios"),
});

export async function POST(request: Request) {
  try {
    // Log the raw request for debugging
    const rawBody = await request.text();
    console.log("Raw request body:", rawBody);
    
    // Parse the body manually
    let body;
    try {
      body = JSON.parse(rawBody);
      console.log("Parsed body:", body);
    } catch (e) {
      console.error("Error parsing JSON body:", e);
      return NextResponse.json({ 
        error: "Invalid JSON body", 
        rawBody 
      }, { status: 400 });
    }
    
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
    
    // Validate request body - explicitly check for required fields before validation
    if (!body.token || !body.deviceId) {
      return NextResponse.json({
        error: "Missing required fields",
        requiredFields: ["token", "deviceId"],
        receivedFields: Object.keys(body || {})
      }, { status: 400 });
    }
    
    try {
      const validatedData = deviceTokenSchema.parse(body);
      
      // Even though we don't have a DeviceToken table yet, we'll create this endpoint
      // to be ready when we do run the database migration.
      // For now, we'll just log the device token and return success.
      
      console.log(`Registered device token for parentId ${parentId}:`, {
        token: validatedData.token,
        deviceId: validatedData.deviceId,
        platform: validatedData.platform
      });
      
      // When the database table is ready, uncomment this code:
      /*
      // Upsert the device token
      const deviceToken = await prisma.deviceToken.upsert({
        where: {
          parentId_deviceId: {
            parentId,
            deviceId: validatedData.deviceId,
          },
        },
        update: {
          token: validatedData.token,
          platform: validatedData.platform,
        },
        create: {
          parentId,
          token: validatedData.token,
          deviceId: validatedData.deviceId,
          platform: validatedData.platform,
        },
      });
      */

      return NextResponse.json({ success: true });
    } catch (zodError) {
      console.error("Validation error:", zodError);
      return NextResponse.json({ 
        error: "Validation error", 
        details: zodError instanceof z.ZodError ? zodError.errors : String(zodError),
        receivedData: body
      }, { status: 400 });
    }
  } catch (error) {
    console.error("Error registering device token:", error);
    return NextResponse.json({ 
      error: "Failed to register device token",
      details: String(error)
    }, { status: 500 });
  }
} 