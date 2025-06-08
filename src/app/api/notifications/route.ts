import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/apn-service";

export async function POST(req: Request) {
  const body = await req.json();
  const { parentId, childId, message } = body;

  if (!parentId || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const notification = await prisma.notification.create({
    data: {
      parentId,
      childId,
      message,
      read: false,
    },
  });

  // Find any device tokens for this parent and send push notifications
  try {
    // Since we don't have the DeviceToken table yet, we'll simulate it
    // When you've run the migration, uncomment this code:
    /*
    const deviceTokens = await prisma.deviceToken.findMany({
      where: { parentId },
      select: { token: true },
    });
    
    if (deviceTokens.length > 0) {
      const tokens = deviceTokens.map(dt => dt.token);
      
      // For now, just log the notification would be sent
      console.log(`Sending push notification to ${tokens.length} devices for parent ${parentId}:`, message);
      
      // Send the actual push notification
      // This is where we'd integrate with the push notification service
      await sendBulkPushNotifications(tokens, message, {
        notificationId: notification.id,
        childId: childId || undefined,
      });
    }
    */
    
    // For testing purposes, we'll log that we would send a push notification
    console.log(`[PUSH NOTIFICATION] Would send to parent ${parentId}:`, message);
    
  } catch (error) {
    console.error("Error sending push notification:", error);
    // We don't want to fail the request if push notifications fail
  }

  return NextResponse.json(notification);
} 