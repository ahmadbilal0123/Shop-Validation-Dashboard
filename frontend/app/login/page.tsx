"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { buildApiUrl, getApiBaseUrl } from "@/lib/utils"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Check if API is configured
  useEffect(() => {
    const apiUrl = getApiBaseUrl()
    if (!apiUrl) {
      setError("API base URL is not configured. Please check your environment variables.")
    }
  }, [])

  const getDefaultPermissions = (role: string): string[] => {
    switch (role) {
      case "admin":
        return ["all"]
      case "manager":
        return ["view_reports", "manage_users", "view_gps", "view_analysis", "manage_regional"]
      case "supervisor":
        return ["view_reports", "view_gps", "view_analysis"]
      case "regional":
        return ["view_reports", "view_gps"]
      case "auditor":
        return ["view_assigned_shops", "submit_audits"]
      default:
        return ["view_reports"]
    }
  }

  const createLocalSession = (user: any, token: string) => {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour session

    const sessionData = {
      user,
      token,
      expiresAt: expiresAt.toISOString(),
    }

    localStorage.setItem("session", JSON.stringify(sessionData))
    // Set session cookie for middleware
    document.cookie = `session=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=86400; SameSite=Lax`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return // prevent multiple submits

    setIsLoading(true)
    setError("")

    try {
      const baseUrl = getApiBaseUrl()
      if (!baseUrl) {
        setError("API base URL is not configured. Please check your environment variables.")
        setIsLoading(false)
        return
      }

      const apiUrl = buildApiUrl("/api/users/login")
      console.log("Calling login endpoint:", apiUrl)
      console.log("Sending payload:", { username, password }) // Log the payload being sent

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()
      console.log("Login response status:", response.status) // Log the HTTP status code
      console.log("Login response ok:", response.ok) // Log if response.ok is true/false
      console.log("Login response data:", data) // Log the full response data

      if (response.ok && data) {
        console.log("Login successful, creating session and redirecting...")
        const user = {
          id: data.id || data.user_id || data.userId || data._id,
          email: data.email || data.username || "",
          name: data.name || data.full_name || data.username || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
          role: data.role || "regional",
          permissions: data.permissions || getDefaultPermissions(data.role || "regional"),
          createdBy: data.created_by || data.createdBy,
        }

        createLocalSession(user, data.token)

        const redirectPath = user.role === "auditor" ? "/auditor-dashboard" : "/dashboard"
        console.log(`Session created, attempting redirect to ${redirectPath} for role: ${user.role}`)
        router.replace(redirectPath)
      } else {
        console.log("Login failed, setting error message.")
        setError(data.message || data.error || "Invalid credentials")
      }
    } catch (err) {
      console.error("Login error caught in catch block:", err) // More specific error log
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
      console.log("Login process finished, isLoading set to false.")
    }
  }

  // Render login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Shop Validation</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
