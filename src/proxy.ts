import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: if there is no Auth.js session cookie at all,
// send the visitor to the sign-in page. Real verification happens in the
// server components via `auth()`, so this never touches the database.
export function proxy(request: NextRequest) {
  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
