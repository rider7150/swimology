import apn from 'apn';
import path from 'path';
import fs from 'fs';

// Initialize APN options
let apnProvider: apn.Provider | null = null;

/**
 * Initialize the APN provider
 */
export function initAPNProvider() {
  try {
    if (apnProvider) {
      return apnProvider;
    }

    const keyPath = path.resolve(process.cwd(), 'APNsKey.p8');
    let keyContent: string | Buffer;
    
    // Check if key file exists
    if (fs.existsSync(keyPath)) {
      keyContent = fs.readFileSync(keyPath, 'utf8');
    } else {
      console.error('APNs key file not found at', keyPath);
      return null;
    }
    
    // Check if key content is valid (roughly)
    if (!keyContent.includes('BEGIN PRIVATE KEY') || !keyContent.includes('END PRIVATE KEY')) {
      console.error('APNs key content appears to be invalid');
      console.log('Key content (first 50 chars):', keyContent.substring(0, 50));
      return null;
    }

    console.log('Using APNs configuration:', {
      keyId: process.env.APNS_KEY_ID,
      teamId: process.env.APNS_TEAM_ID,
      production: process.env.NODE_ENV === 'production',
      keyLength: keyContent.length
    });

    const options: apn.ProviderOptions = {
      token: {
        key: keyContent, // Use the key content directly instead of file path
        keyId: process.env.APNS_KEY_ID || '',
        teamId: process.env.APNS_TEAM_ID || '',
      },
      production: process.env.NODE_ENV === 'production',
    };

    apnProvider = new apn.Provider(options);
    console.log('APN provider initialized');
    return apnProvider;
  } catch (error) {
    console.error('Error initializing APN provider:', error);
    return null;
  }
}

/**
 * Send a push notification to a device
 */
export async function sendPushNotification(
  deviceToken: string, 
  message: string, 
  payload?: Record<string, any>
): Promise<apn.Responses | null> {
  try {
    const provider = initAPNProvider();
    if (!provider) {
      console.error('APN provider not initialized');
      return null;
    }

    const notification = new apn.Notification();
    
    notification.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires in 1 hour
    notification.badge = 1;
    notification.sound = "ping.aiff";
    notification.alert = message;
    notification.topic = process.env.APNS_BUNDLE_ID || 'com.swimology.app';
    
    if (payload) {
      notification.payload = payload;
    }

    console.log(`Sending push notification to device ${deviceToken}: ${message}`);
    const result = await provider.send(notification, deviceToken);
    
    if (result.failed.length > 0) {
      console.error('Push notification failed:', result.failed);
    }
    
    return result;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return null;
  }
}

/**
 * Send push notifications to multiple device tokens
 */
export async function sendBulkPushNotifications(
  deviceTokens: string[], 
  message: string, 
  payload?: Record<string, any>
): Promise<apn.Responses | null> {
  if (!deviceTokens.length) {
    return null;
  }
  
  try {
    const provider = initAPNProvider();
    if (!provider) {
      console.error('APN provider not initialized');
      return null;
    }

    const notification = new apn.Notification();
    
    notification.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires in 1 hour
    notification.badge = 1;
    notification.sound = "ping.aiff";
    notification.alert = message;
    notification.topic = process.env.APNS_BUNDLE_ID || 'com.swimology.app';
    
    if (payload) {
      notification.payload = payload;
    }

    console.log(`Sending push notification to ${deviceTokens.length} devices: ${message}`);
    const result = await provider.send(notification, deviceTokens);
    
    if (result.failed.length > 0) {
      console.error('Some push notifications failed:', result.failed);
    }
    
    return result;
  } catch (error) {
    console.error('Error sending bulk push notifications:', error);
    return null;
  }
} 