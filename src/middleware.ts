import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Public routes - no middleware protection
    if (path === "/" || path === "/login" || path === "/register" || path === "/forgot-password" || path === "/reset-password") {
      return NextResponse.next();
    }

    // Protected routes based on role
    if (path.startsWith("/organizations")) {
      // Allow access to specific organization routes for ADMIN role
      if (token?.role === 'ADMIN') {
        // Extract organization ID from the URL
        const urlParts = path.split('/');
        const organizationIdIndex = urlParts.indexOf('organizations') + 1;
        const urlOrgId = urlParts[organizationIdIndex];
        
        // Allow if the admin is accessing their own organization
        if (urlOrgId === token.organizationId) {
          return NextResponse.next();
        }
        return NextResponse.redirect(new URL("/", req.url));
      }

      // For the organizations list page, only super admins can access
      if (path === "/organizations" && token?.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL("/", req.url));
      }

      // For specific organization pages
      if (token?.role !== 'SUPER_ADMIN' && token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Allow public routes without authentication
        if (path === "/" || path === "/login" || path === "/register" || path === "/forgot-password" || path === "/reset-password" || path.startsWith('/images/') || path.startsWith('/api/')) {
          return true;
        }
        // Require authentication for all other routes
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}; 