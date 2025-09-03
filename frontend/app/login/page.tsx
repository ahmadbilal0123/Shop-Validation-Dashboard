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
       <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-8">
  {/* Main Title */}
  <h1 className="text-5xl md:text-6xl font-bold leading-tight drop-shadow-2xl mb-6 bg-gradient-to-r from-white to-white/90 bg-clip-text">
    Welcome to
    <span className="block text-transparent bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text">
      ShelfSense
    </span>
  </h1>
  
  {/* Subtitle */}
  <p className="text-xl md:text-2xl text-white/95 max-w-2xl leading-relaxed drop-shadow-lg mb-8">
    Advanced Shop Validation & Management Platform
  </p>
  
  {/* Company Attribution */}
  <div className="flex flex-col items-center gap-3">
    <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
    <p className="text-lg font-medium text-white/90 drop-shadow-md">
      Powered by
    </p>
    <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-white/20">
      <span className="text-2xl font-bold bg-gradient-to-r from-yellow-200 via-orange-200 to-yellow-300 bg-clip-text text-transparent drop-shadow-lg">
        Gen-T AI Solutions
      </span>
    </div>
  </div>
  
  {/* Feature highlights */}
  <div className="mt-12 flex flex-wrap justify-center gap-4 max-w-lg">
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
      <span className="text-sm text-white/90">Real-time Analytics</span>
    </div>
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
      <span className="text-sm text-white/90">GPS Tracking</span>
    </div>
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
      <span className="text-sm text-white/90">Smart Reports</span>
    </div>
  </div>
</div>

  </div>

  {/* Login Card Section - Responsive for all devices */}
  <div className="flex items-center justify-center w-full h-screen p-4 md:p-12 relative">
    {/* Mobile-only enhanced gradient background */}
    <div className="absolute md:hidden inset-0 w-full h-full bg-gradient-to-br from-[#6c3ef4] via-[#a259ec] to-[#1447e6] z-0">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 right-16 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-purple-400/10 rounded-full blur-3xl"></div>
      </div>
    </div>
    
    <Card className="w-full max-w-md shadow-2xl rounded-3xl relative z-10 border-0 bg-white/95 backdrop-blur-xl md:bg-white">
      <CardHeader className="text-center pt-8 pb-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1447E6] to-[#6c3ef4] shadow-lg">
          <img src="/logo.png" alt="ShelfSense Logo" className="h-10 w-10" />
        </div>
        <CardTitle className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</CardTitle>
        <CardDescription className="text-slate-600 text-base">
          Sign in to your ShelfSense account
        </CardDescription>
      </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-slate-700">Email Address</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your email address"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="text-base px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#1447E6] focus:ring-2 focus:ring-[#1447E6]/20 transition-all duration-200"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                  <a className="text-[#1447E6] text-sm hover:underline transition-colors duration-200 font-medium" href="#">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-base px-4 py-3 pr-12 border-2 border-slate-200 rounded-xl focus:border-[#1447E6] focus:ring-2 focus:ring-[#1447E6]/20 transition-all duration-200"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#1447E6] to-[#6c3ef4] hover:from-[#0f36b2] hover:to-[#5a2ec4] text-white px-4 py-3 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
              
              {/* Additional footer text */}
              <div className="text-center pt-4">
                <p className="text-sm text-slate-500">
                  By signing in, you agree to our{" "}
                  <a href="#" className="text-[#1447E6] hover:underline font-medium">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-[#1447E6] hover:underline font-medium">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
