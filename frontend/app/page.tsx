"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = () => {
      try {
        const sessionData = localStorage.getItem("session")

        if (sessionData) {
          const session = JSON.parse(sessionData)

          // Validate token & expiration
          const token = session?.token
          const expiresAt = session?.expiresAt

          if (token && expiresAt && new Date() < new Date(expiresAt)) {
            // Keep token fresh for API calls
            localStorage.setItem("authToken", token)

            if (pathname !== "/dashboard") {
              router.push("/dashboard")
            }
            return
          } else {
            // Token invalid or expired
            localStorage.removeItem("session")
            localStorage.removeItem("authToken")
          }
        }
      } catch (error) {
        console.warn("Invalid session data, clearing storage")
        localStorage.removeItem("session")
        localStorage.removeItem("authToken")
      }

      // Redirect to login if no valid token
      if (pathname !== "/login") {
        router.push("/login")
      }
    }

    const timer = setTimeout(() => {
      checkAuth()
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
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
