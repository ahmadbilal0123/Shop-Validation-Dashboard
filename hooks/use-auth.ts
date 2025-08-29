"use client"

import { useEffect, useState, useCallback } from "react"
import type { User } from "@/lib/auth"
import { getSession, createSession, logoutUser } from "@/lib/auth"
import { buildApiUrl } from "@/lib/utils"

interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  requireAuth: () => User | null
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    setUser(session?.user ?? null)
    setIsLoading(false)
  }, [])

  const login = useCallback(async (emailOrUsername: string, password: string) => {
    try {
      const apiUrl = buildApiUrl("/api/users/login")
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username: emailOrUsername, password }),
      })

      const data = await response.json()
      if (!response.ok) {
        return { success: false, error: data?.message || data?.error || "Login failed" }
      }

      const mappedUser: User = {
        id: data.id || data.user_id || data.userId || data._id,
        email: data.email || data.username || "",
        name: data.name || data.full_name || data.username || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
        role: data.role || "regional",
        permissions: data.permissions || ["view_reports"],
        createdBy: data.created_by || data.createdBy,
      }

      createSession(mappedUser, data.token)
      setUser(mappedUser)
      return { success: true }
    } catch (err) {
      return { success: false, error: "Network error" }
    }
  }, [])

  const logout = useCallback(() => {
    logoutUser()
  }, [])

  const requireAuth = useCallback((): User | null => {
    const session = getSession()
    if (!session) return null
    return session.user
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    requireAuth,
  }
}

export default useAuth


