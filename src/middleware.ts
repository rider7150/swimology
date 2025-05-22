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

  // 1) Login endpoint: always allow
  if (pathname === "/api/auth/mobile-auth") {
    return NextResponse.next();
  }

  // 2) API routes: try header JWT first, then NextAuth session
  if (pathname.startsWith("/api/")) {
    // 2a) Check for Bearer token in Authorization header
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        jwt.verify(token, process.env.NEXTAUTH_SECRET!);
        return NextResponse.next();
      } catch {
        return NextResponse.json(
          { error: "Invalid token" },
          { status: 401 }
        );
      }
    }

    // 2b) Fallback to NextAuth session cookie
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
    if (session) {
      return NextResponse.next();
    }

    // 2c) Otherwise, unauthorized
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 3) Page routes: your existing redirect logic
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  const publicPaths = ["/login", "/register", "/api/auth"];
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  if (!session && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}