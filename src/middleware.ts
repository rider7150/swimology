import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) API routes
  if (pathname.startsWith("/api/")) {
    // 1a) Allow login endpoint through without token
    if (pathname === "/api/auth/mobile-auth") {
      return NextResponse.next();
    }

    // 1b) All other API routes require a valid JWT or NextAuth session
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
    if (token) {
      return NextResponse.next();
    } else {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, statusText: "Unauthorized" }
      );
    }
  }

  // 2) Page routes: redirect to /login if no session
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  const publicPaths = ["/login", "/register", "/api/auth"];
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  if (!session && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 3) Everything else
  return NextResponse.next();
}