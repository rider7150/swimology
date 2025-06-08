import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Check environment variables
    const apnsKeyId = process.env.APNS_KEY_ID || null;
    const apnsTeamId = process.env.APNS_TEAM_ID || null;
    const apnsBundleId = process.env.APNS_BUNDLE_ID || null;
    
    // Check if APNsKey.p8 file exists
    const keyPath = path.resolve(process.cwd(), 'APNsKey.p8');
    const apnsKeyExists = fs.existsSync(keyPath);
    
    // Check if key content is valid (roughly)
    let apnsKeyValid = false;
    if (apnsKeyExists) {
      try {
        const keyContent = fs.readFileSync(keyPath, 'utf8');
        apnsKeyValid = keyContent.includes('BEGIN PRIVATE KEY') && keyContent.includes('END PRIVATE KEY');
      } catch (error) {
        console.error('Error reading APNsKey.p8:', error);
      }
    }
    
    return NextResponse.json({
      APNS_KEY_ID: apnsKeyId,
      APNS_TEAM_ID: apnsTeamId,
      APNS_BUNDLE_ID: apnsBundleId,
      APNsKeyExists: apnsKeyExists,
      APNsKeyValid: apnsKeyValid,
      NODE_ENV: process.env.NODE_ENV
    });
  } catch (error) {
    console.error("Error checking environment:", error);
    return NextResponse.json({ 
      error: "Failed to check environment",
      details: String(error)
    }, { status: 500 });
  }
} 