import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotification, sendBulkPushNotifications } from "@/lib/apn-service";

export async function POST(req: Request) {
  console.log("[NOTIFICATIONS] Received notification request");
  
  const body = await req.json();
  console.log("[NOTIFICATIONS] Request body:", body);
  
  const { parentId, childId, message, deviceToken } = body;
  //const { parentId, childId, message} = body;
  console.log("IN NOTIFICATIONS ROUTE");
  if (!parentId || !message) {
    console.log("[NOTIFICATIONS] Missing required fields:", { parentId, message });
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  console.log("[NOTIFICATIONS] Creating notification in database");
  const notification = await prisma.notification.create({
    data: {
      parentId,
      childId,
      message,
      read: false,
    },
  });
  console.log("[NOTIFICATIONS] Created notification:", notification);

  // Find any device tokens for this parent and send push notifications
  try {
    // If a device token was directly provided in the request, use it
    // This is useful for testing from mobile apps
    if (deviceToken) {
      console.log(`[NOTIFICATIONS] Using provided device token for parent ${parentId}:`, deviceToken);
      
      await sendPushNotification(
        deviceToken,
        message,
        {
          notificationId: notification.id,
          childId: childId || undefined,
        }
      );
    } else {
      // Look up device tokens for this parent
      const deviceTokens = await prisma.deviceToken.findMany({
        where: { parentId },
        select: { deviceToken: true },
      });
      
      if (deviceTokens.length > 0) {
        const tokens = deviceTokens.map(dt => dt.deviceToken);
        
        console.log(`[NOTIFICATIONS] Sending push notification to ${tokens.length} devices for parent ${parentId}:`, message);
          
        await sendBulkPushNotifications(tokens, message, {
          notificationId: notification.id,
          childId: childId || undefined,
        });
      } else {
        console.log(`[NOTIFICATIONS] No device tokens found for parent ${parentId}`);
      }
    }
  } catch (error) {
    console.error("[NOTIFICATIONS] Error sending push notification:", error);
    // We don't want to fail the request if push notifications fail
  }

  return NextResponse.json(notification);
} 