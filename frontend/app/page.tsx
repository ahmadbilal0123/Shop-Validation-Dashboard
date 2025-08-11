"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Simple check for existing session
    const checkAuth = () => {
      try {
        const sessionData = localStorage.getItem("session")
        if (sessionData) {
          const session = JSON.parse(sessionData)
          // Check if session is not expired
          if (new Date() < new Date(session.expiresAt)) {
            router.push("/dashboard")
            return
          }
        }
      } catch (error) {
        console.log("No valid session found")
      }

      // No valid session, go to login
      router.push("/login")
    }

    // Small delay to prevent flash
    const timer = setTimeout(() => {
      checkAuth()
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

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
