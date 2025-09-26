import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PROTECTED_PATHS = ["/dashboard", "/auditor-dashboard"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect dashboard routes only
  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    const sessionCookie = request.cookies.get("session")?.value

    if (!sessionCookie) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = "/login"
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      const session = JSON.parse(sessionCookie)
      if (!session.token || !session.expiresAt || new Date() > new Date(session.expiresAt)) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = "/login"
        loginUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(loginUrl)
      }
    } catch {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = "/login"
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}
