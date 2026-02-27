import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/https:\/\/([^.]+)/)?.[1] || "supabase";
  const authCookie = request.cookies.get(`sb-${projectRef}-auth-token`);
  


  const supabaseResponse = NextResponse.next({ request });

  // Public routes that don't require auth
  const publicRoutes = ["/login", "/signup", "/auth/callback", "/api/auth"];
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // If we have a base64 auth cookie, decode and validate it
  if (authCookie?.value) {
    try {
      const decoded = JSON.parse(Buffer.from(authCookie.value, "base64").toString());

      
      // Check if token is valid (not expired)
      if (decoded.access_token && decoded.expires_at > Date.now() / 1000) {
        // Token is valid
        if (request.nextUrl.pathname === "/login") {
          const url = request.nextUrl.clone();
          url.pathname = "/quick-transaction";
          return NextResponse.redirect(url);
        }
        return supabaseResponse;
      }
    } catch (e) {

    }
  }

  // No valid session - redirect to login if protected route
  if (!isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
