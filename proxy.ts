import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const response = NextResponse.next()

  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  const pathname = request.nextUrl.pathname

  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store, must-revalidate")
  } else if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico)$/)) {
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable")
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon-|screenshot-).*)"],
}
