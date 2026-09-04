import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js 16 Request Interceptor (proxy.ts)
 * Protects routes requiring customer and admin authentication.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authToken =
    request.cookies.get("auth_token")?.value ||
    request.cookies.get("refresh_token")?.value;

  const userRole = request.cookies.get("user_role")?.value;

  const isCheckoutRoute = pathname.startsWith("/checkout");
  const isOrdersRoute = pathname.startsWith("/orders");
  const isAdminRoute = pathname.startsWith("/admin");

  // If attempting to access checkout, orders, or admin without authentication
  if (!authToken && (isCheckoutRoute || isOrdersRoute || isAdminRoute)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing admin without admin privileges
  if (isAdminRoute && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Next.js 16 Route Matcher
export const config = {
  matcher: ["/checkout/:path*", "/orders/:path*", "/admin/:path*"],
};

// Aliased export for compatibility
export const middleware = proxy;
