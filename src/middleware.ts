// src/app/middleware.ts
export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 0) Allow public images
  if (pathname.startsWith("/images/")) {
    return NextResponse.next();
  }

  // 1) Allow login endpoint
  if (pathname === "/api/auth/mobile-auth") {
    return NextResponse.next();
  }

  // 2) Protect all other API routes via Bearer JWT
  if (pathname.startsWith("/api/")) {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    try {
      // Verify against your NextAuth secret
      jwt.verify(token, process.env.NEXTAUTH_SECRET!);
      return NextResponse.next();
    } catch (err) {
      console.warn("JWT verify failed:", err);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  }

  // 3) Everything else (page routes) — keep your existing redirect logic if any,
  // or just allow through if you don’t need page protection in this app:
  return NextResponse.next();
}