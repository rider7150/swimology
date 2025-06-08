import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/apn-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { parentId, childId, message, deviceToken } = body;

    if (!parentId || !message) {
      return NextResponse.json({ error: "parentId and message are required" }, { status: 400 });
    }

    // First, create a notification in the database
    const notification = await prisma.notification.create({
      data: {
        parentId,
        childId,
        message,
        read: false,
      },
    });

    console.log(`Created notification in database:`, notification);

    // Attempt to send a push notification
    let pushResult = null;
    if (deviceToken) {
      console.log(`Attempting to send push notification to device token: ${deviceToken}`);
      
      try {
        pushResult = await sendPushNotification(
          deviceToken,
          message,
          {
            notificationId: notification.id,
            childId: childId || undefined,
          }
        );
        
        console.log("Push notification result:", pushResult);
      } catch (pushError) {
        console.error("Error sending push notification:", pushError);
      }
    } else {
      console.log("No device token provided, skipping push notification");
    }

    return NextResponse.json({
      success: true,
      notification,
      pushNotification: {
        sent: pushResult ? true : false,
        result: pushResult ? {
          successful: pushResult.sent.length,
          failed: pushResult.failed.length,
          failedDetails: pushResult.failed.map(f => ({
            device: f.device,
            error: f.error?.toString()
          }))
        } : null
      }
    });
  } catch (error) {
    console.error("Error in test notification endpoint:", error);
    return NextResponse.json({ 
      error: "Failed to test notification",
      details: String(error)
    }, { status: 500 });
  }
} 