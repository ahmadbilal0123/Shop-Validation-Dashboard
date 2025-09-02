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

  return new Promise((resolve) => {
    setTimeout(() => {
      const storedSession = localStorage.getItem("session")
        console.log("[v0] Session verification:", storedSession ? "Success" : "Failed")
        resolve(true)
      }, 100)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

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

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()
      console.log("Login response status:", response.status)
      console.log("Login response data:", data)

      if (response.ok && data) {
        console.log("Login successful, creating session...")
        const user = {
          id: data.id || data.user_id || data.userId || data._id,
          email: data.email || data.username || "",
          name: data.name || data.full_name || data.username || ((data.firstName || '') + ' ' + (data.lastName || '')).trim(),
          role: data.role || "regional",
          permissions: data.permissions || getDefaultPermissions(data.role || "regional"),
          createdBy: data.created_by || data.createdBy,
        }

        await createLocalSession(user, data.token)

        const redirectPath = user.role === "auditor" ? "/auditor-dashboard" : "/dashboard"
        console.log('[v0] Session created successfully, redirecting to ' + redirectPath)

        window.location.href = redirectPath
      } else {
        console.log("Login failed, setting error message.")
        setError(data.message || data.error || "Invalid credentials")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center md:grid md:grid-cols-2">
      {/* Left Half with Shop Image Background (Desktop/Tablet only) */}
      <div className="hidden md:flex flex-col justify-center px-16 py-24 w-full h-screen gap-6 text-white relative overflow-hidden">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(108, 62, 244, 0.85), rgba(162, 89, 236, 0.85)), url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
          }}
        />
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold leading-tight drop-shadow-lg">Welcome to ShelfSense</h1>
          <p className="text-lg text-white/95 max-w-lg drop-shadow-md">
            Connecting auditors and teams with verified shops — manage validations, assignments and reports from a single place.
          </p>
          <div className="mt-6 space-y-3">
            <p className="font-medium drop-shadow-md">✓ Reliable reporting</p>
            <p className="font-medium drop-shadow-md">✓ Fast shop assignment</p>
            <p className="font-medium drop-shadow-md">✓ Role based access control</p>
          </div>
        </div>
  </div>

  {/* Login Card Section - Responsive for all devices */}
  <div className="flex items-center justify-center w-full h-screen p-4 md:p-12 relative">
  {/* Mobile-only purple gradient background */}
  <div className="absolute md:hidden inset-0 w-full h-full bg-gradient-to-br from-[#6c3ef4] via-[#a259ec] to-[#1447e6] z-0" />
  <Card className="w-full max-w-md shadow-xl rounded-2xl relative z-10">
          <CardHeader className="text-center pt-8">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <Shield className="h-8 w-8 text-[#1447E6]" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-slate-600">Sign in to your account to continue</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-sm font-medium text-slate-700">Email</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="text-base px-3 py-2"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                  <a className="text-[#1447E6] text-sm hover:underline" href="#">Forgot password?</a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-base px-3 py-2"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-[#1447E6]" /> : <Eye className="h-4 w-4 text-[#1447E6]" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4 text-[#1447E6]" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-[#1447E6] hover:bg-[#0f36b2] text-white px-4 py-2 rounded-lg font-medium text-base"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
