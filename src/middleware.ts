import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) For API routes, enforce JWT or session but do NOT redirect to login
  if (pathname.startsWith("/api/")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (token) {
      return NextResponse.next();
    } else {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, statusText: "Unauthorized" }
      );
    }
  }

  // 2) For everything else, your page-guard logic
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  const publicPaths = ["/login", "/register", "/api/auth","/images/"];
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  if (!session && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}