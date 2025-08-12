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
          if (new Date() < new Date(session.expiresAt)) {
            // Only redirect if not already on /dashboard
            if (pathname !== "/dashboard") {
              router.push("/dashboard")
            }
            return
          }
        }
      } catch (error) {
        console.log("No valid session found")
      }

      // Only redirect if not already on /login
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
