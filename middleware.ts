import { NextResponse, type NextRequest } from "next/server"

/**
 * Exposes the request pathname to server components (via the `x-pathname` header) so the admin
 * layout can enforce the correct capability for the page being viewed. This does not itself make
 * authorization decisions — that happens server-side in the admin layout and route handlers.
 */
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.set("x-pathname", request.nextUrl.pathname)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
}
