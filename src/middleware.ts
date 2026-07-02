import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Guard the admin pages + admin APIs. Unauthenticated (or non-@defuse.org)
// users get bounced to /signin; API calls get a 401.
export default auth((req) => {
  if (req.auth) return;
  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/signin", req.nextUrl.origin));
});

export const config = {
  matcher: [
    "/compose",
    "/drafts",
    "/recipients",
    "/api/drafts/:path*",
    "/api/recipients/:path*",
    "/api/render",
    "/api/send",
  ],
};
