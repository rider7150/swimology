# Push Notification Environment Setup

To enable iOS push notifications, you need to add the following environment variables to your `.env.local` file:

```
# Apple Push Notification Service (APNs) Configuration
APNS_KEY_ID=your_key_id_here
APNS_TEAM_ID=your_team_id_here
APNS_BUNDLE_ID=com.swimology.app
```

## Steps to obtain these values:

1. **APNS_KEY_ID**: This is the Key ID from your Apple Developer account.
   - Go to your Apple Developer account
   - Navigate to Certificates, Identifiers & Profiles
   - Go to Keys
   - Find or create a key with the APNs capability
   - The Key ID will be displayed

2. **APNS_TEAM_ID**: This is your Apple Developer Team ID.
   - Go to your Apple Developer account
   - Click on Membership
   - Your Team ID will be displayed under the Team ID section

3. **APNS_BUNDLE_ID**: This is your app's bundle identifier.
   - This should match the bundle ID you used when registering your app in your Apple Developer account

## APNsKey.p8 File

The APNsKey.p8 file in the root directory should contain your private key from Apple. Replace the placeholder content with your actual private key.

## Database Migration

To fully enable push notifications, run the Prisma migration to add the DeviceToken model:

```
npx prisma migrate dev --name add_device_tokens
```

After running the migration, uncomment the code in:
- `src/app/api/mobile/device-tokens/route.ts`
- `src/app/api/notifications/route.ts`

## Testing Push Notifications

To test push notifications:
1. Register a device token using the `/api/mobile/device-tokens` endpoint
2. Create a notification using the `/api/notifications` endpoint
3. Check the logs to see if the push notification was sent successfully 