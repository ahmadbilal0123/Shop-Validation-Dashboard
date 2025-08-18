"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const isValidSession = (session: any) => {
      const token = session?.token
      const expiresAt = session?.expiresAt
      return token && expiresAt && new Date() < new Date(expiresAt)
    }

    const clearSession = () => {
      localStorage.removeItem("session")
      localStorage.removeItem("authToken")
      document.cookie = "session=; path=/; max-age=0"
    }

    const redirectToDashboard = (role: string) => {
      if (role === "auditor" && pathname !== "/auditor-dashboard") {
        router.replace("/auditor-dashboard")
      } else if (role !== "auditor" && pathname !== "/dashboard") {
        router.replace("/dashboard")
      }
    }

    const handleValidSession = (session: any) => {
      localStorage.setItem("authToken", session.token)

      // ✅ Save cookie so middleware can read it immediately
      document.cookie = `session=${encodeURIComponent(
        JSON.stringify(session)
      )}; path=/; max-age=86400; SameSite=Strict`

      const sessionUser = session?.user
      redirectToDashboard(sessionUser?.role)
      setIsLoading(false)
    }

    const handleInvalidSession = () => {
      clearSession()
      if (pathname !== "/login") {
        router.replace("/login")
      }
      setIsLoading(false)
    }

    const checkAuth = () => {
      try {
        const sessionData = localStorage.getItem("session")
        if (sessionData) {
          const session = JSON.parse(sessionData)
          if (isValidSession(session)) {
            handleValidSession(session)
            return
          }
        }
      } catch (error) {
        console.error("Invalid session data, clearing storage:", error)
      }
      handleInvalidSession()
    }

    checkAuth()
  }, [router, pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return null
}
