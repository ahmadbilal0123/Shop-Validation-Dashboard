// User interface
export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "manager" | "supervisor" | "regional"
  permissions: string[]
  createdBy?: string
}

// Session interface
export interface Session {
  user: User
  token?: string
  expiresAt: string
}

// Session storage key
const SESSION_KEY = "session"
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

// Create a new session
export function createSession(user: User, token?: string): Session {
  const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString()

  const session: Session = {
    user,
    token,
    expiresAt,
  }

  // Store in localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  return session
}

// Get current session
export function getSession(): Session | null {
  if (typeof window === "undefined") return null

  try {
    const sessionData = localStorage.getItem(SESSION_KEY)
    if (!sessionData) return null

    const session: Session = JSON.parse(sessionData)

    // Check if session is expired
    if (new Date() > new Date(session.expiresAt)) {
      clearSession()
      return null
    }

    return session
  } catch (error) {
    console.error("Error reading session:", error)
    clearSession()
    return null
  }
}

// Clear current session
export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY)
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getSession() !== null
}

// Get current user
export function getCurrentUser(): User | null {
  const session = getSession()
  return session?.user || null
}

// Check if user has permission
export function hasPermission(permission: string): boolean {
  const user = getCurrentUser()
  if (!user) return false

  // Admin has all permissions
  if (user.role === "admin" || user.permissions.includes("all")) {
    return true
  }

  return user.permissions.includes(permission)
}

// Check if user has role
export function hasRole(role: string | string[]): boolean {
  const user = getCurrentUser()
  if (!user) return false

  if (Array.isArray(role)) {
    return role.includes(user.role)
  }

  return user.role === role
}

// Get role-based permissions
export function getRolePermissions(role: string): string[] {
  switch (role) {
    case "admin":
      return ["all"]
    case "manager":
      return ["view_reports", "manage_users", "view_gps", "view_analysis", "manage_regional", "export_data"]
    case "supervisor":
      return ["view_reports", "view_gps", "view_analysis", "export_data"]
    case "regional":
      return ["view_reports", "view_gps"]
    default:
      return ["view_reports"]
  }
}

// Check if user can manage other user
export function canManageUser(targetUser: User): boolean {
  const currentUser = getCurrentUser()
  if (!currentUser) return false

  // Admin can manage everyone
  if (currentUser.role === "admin") return true

  // Manager can manage supervisor and regional users
  if (currentUser.role === "manager") {
    return ["supervisor", "regional"].includes(targetUser.role)
  }

  // Supervisor can manage regional users
  if (currentUser.role === "supervisor") {
    return targetUser.role === "regional"
  }

  return false
}

// Refresh session (extend expiry)
export function refreshSession(): boolean {
  const session = getSession()
  if (!session) return false

  // Create new session with extended expiry
  createSession(session.user, session.token)
  return true
}

// Login function (to be used with API)
export async function loginUser(
  email: string,
  password: string,
): Promise<{
  success: boolean
  user?: User
  error?: string
}> {
  try {
    // This would typically call your API
    // For now, it's a placeholder that should be implemented in the login component
    throw new Error("Login should be handled in the login component with API call")
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
    }
  }
}

// Logout function
export function logoutUser(): void {
  clearSession()

  // Redirect to login page
  if (typeof window !== "undefined") {
    window.location.href = "/login"
  }
}

// Check session validity
export function isSessionValid(): boolean {
  const session = getSession()
  if (!session) return false

  return new Date() < new Date(session.expiresAt)
}

// Get session expiry time
export function getSessionExpiry(): Date | null {
  const session = getSession()
  return session ? new Date(session.expiresAt) : null
}
