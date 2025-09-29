import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "./jwt"

export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  return user
}

export async function requireRole(request: NextRequest, allowedRoles: string[]) {
  const user = await requireAuth(request)

  if (user instanceof NextResponse) {
    return user // Return the error response
  }

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  return user
}

export function createAuthResponse(data: any, token?: string) {
  const response = NextResponse.json(data)

  if (token) {
    // Set HTTP-only cookie for web clients
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })
  }

  return response
}
