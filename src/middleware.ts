// src/app/middleware.ts
export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

    // 0) Passthrough for your public images folder
    if (pathname.startsWith("/images/")) {
      return NextResponse.next();
    }
    
  // 1) Always allow your mobile-login endpoint
  if (pathname === "/api/auth/mobile-auth") {
    return NextResponse.next();
  }

  // 2) Protect API routes
  if (pathname.startsWith("/api/")) {
    // 2a) Try Bearer JWT first
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        jwt.verify(token, process.env.NEXTAUTH_SECRET!);
        return NextResponse.next();
      } catch (err) {
        console.log("⚠️ Bearer JWT verify failed:", err);
        // fall through to NextAuth cookie check
      }
    }

    // 2b) Fallback to NextAuth session cookie
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
    if (session) {
      return NextResponse.next();
    }

    // 2c) No valid auth → 401 JSON
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, statusText: "Unauthorized" }
    );
  }

  // 3) Protect page routes (redirect to /login)
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  const publicPaths = ["/login", "/register", "/api/auth"];
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 4) Otherwise, allow
  return NextResponse.next();
}