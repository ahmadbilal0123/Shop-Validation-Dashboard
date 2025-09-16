"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, AlertTriangle } from "lucide-react"
import { buildApiUrl, getApiBaseUrl } from "@/lib/utils"

// Custom CSS for animations
const floatingAnimations = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
  @keyframes float-delayed {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(-3deg); }
  }
  @keyframes float-slow {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(2deg); }
  }
  @keyframes imageSlideIn {
    0% { 
      opacity: 0; 
      transform: scale(1.1) translateX(50px);
    }
    100% { 
      opacity: 0.3; 
      transform: scale(1) translateX(0);
    }
  }
  @keyframes imageSlideOut {
    0% { 
      opacity: 0.3; 
      transform: scale(1) translateX(0);
    }
    100% { 
      opacity: 0; 
      transform: scale(0.9) translateX(-50px);
    }
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  .animate-float-delayed {
    animation: float-delayed 8s ease-in-out infinite 2s;
  }
  .animate-float-slow {
    animation: float-slow 10s ease-in-out infinite 4s;
  }
  .animate-slide-in {
    animation: imageSlideIn 1s ease-out forwards;
  }
  .animate-slide-out {
    animation: imageSlideOut 1s ease-in forwards;
  }
`

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const router = useRouter()

  // Images for background
  const shopImages = [
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=2126&q=80",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1596122962004-640ac7b8e5e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2040&q=80",
    "https://images.unsplash.com/photo-1607082349566-187342175e2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1567521464027-f31bd2dcb0ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1572635196184-84e35138cf62?ixlib=rb-4.0.3&auto=format&fit=crop&w=2080&q=80",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
  ]

  // Remove extra space on the entire page (for Next.js, set html/body/#__next to h-full in global.css)
  useEffect(() => {
    document.documentElement.style.height = "100%";
    document.body.style.height = "100%";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
  }, []);

  // Check if API is configured
  useEffect(() => {
    const apiUrl = getApiBaseUrl()
    if (!apiUrl) {
      setError("API base URL is not configured. Please check your environment variables.")
    }
  }, [])

  // Random image rotation effect with smooth transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % shopImages.length)
        setIsTransitioning(false)
      }, 500)
    }, 4000)
    return () => clearInterval(interval)
  }, [shopImages.length])

  const getDefaultPermissions = (role: string): string[] => {
    switch (role) {
      case "admin":
        return ["all"]
      case "manager":
        return ["view_reports", "manage_users", "view_gps", "view_analysis", "manage_regional"]
      case "supervisor":
        return ["view_reports", "view_gps", "view_analysis"]
      case "executive":
        return ["view_reports", "view_gps"]
      case "auditor":
        return ["view_assigned_shops", "submit_audits"]
      default:
        return ["view_reports"]
    }
  }

  const createLocalSession = (user: any, token: string) => {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)
    const sessionData = { user, token, expiresAt: expiresAt.toISOString() }
    localStorage.setItem("session", JSON.stringify(sessionData))
    document.cookie = `session=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=86400; SameSite=Lax`
    return new Promise((resolve) => {
      setTimeout(() => {
        const storedSession = localStorage.getItem("session")
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
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      if (response.ok && data) {
        const user = {
          id: data.id || data.user_id || data.userId || data._id,
          email: data.email || data.username || "",
          name:
            data.name ||
            data.full_name ||
            data.username ||
            ((data.firstName || "") + " " + (data.lastName || "")).trim(),
          role: data.role || "regional",
          permissions: data.permissions || getDefaultPermissions(data.role || "regional"),
          createdBy: data.created_by || data.createdBy,
        }
        await createLocalSession(user, data.token)
        let redirectPath = "/dashboard"
        if (user.role === "auditor") {
          redirectPath = "/auditor-dashboard"
        } else if (user.role === "manager") {
          redirectPath = "/manager"
        } else if (user.role === "supervisor") {
          redirectPath = "/supervisor"
        } else if (user.role === "executive") {
          redirectPath = "/executive"
        }
        window.location.href = redirectPath
      } else {
        setError(data.message || data.error || "Invalid credentials")
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style jsx>{floatingAnimations}</style>
      <div className="h-screen w-full flex items-stretch justify-stretch lg:grid lg:grid-cols-2 m-0 p-0">
        {/* Left Half - Brand/Images */}
        <div className="hidden lg:flex flex-col justify-center w-full h-full relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-blue-950">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 right-1/3 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-float"></div>
            <div className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl animate-float-delayed"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:80px_80px]"></div>
          </div>
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              key={currentImageIndex}
              src={shopImages[currentImageIndex] || "/placeholder.svg"}
              alt="Retail shop interior"
              className={`w-full h-full object-cover transition-all duration-1000 ease-in-out ${
                isTransitioning ? "opacity-0 transform scale-110 blur-sm" : "opacity-50 transform scale-100 blur-none"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-blue-900/50 to-blue-950/60"></div>
            <div
              className={`absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-blue-800/10 transition-opacity duration-1000 ${
                isTransitioning ? "opacity-100" : "opacity-0"
              }`}
            ></div>
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8 xl:px-16">
            <div className="flex flex-col items-center">
              <div>
                <h1 className="text-6xl xl:text-7xl font-bold text-white mb-4 tracking-tight">ShelfVoice</h1>
                <p className="text-blue-200 text-xl xl:text-2xl font-medium text-center">
                  Powered by Gen-T AI Solutions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive Login Card Section - All devices */}
        <div className="flex items-center justify-center w-full h-full p-4 sm:p-6 lg:p-0 relative">
          {/* Mobile/Tablet Background */}
          <div className="absolute lg:hidden inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-blue-950 z-0">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-30">
              <div className="absolute top-16 left-8 w-24 sm:w-32 h-24 sm:h-32 bg-blue-400/20 rounded-full blur-2xl animate-float"></div>
              <div className="absolute bottom-24 right-12 w-32 sm:w-40 h-32 sm:h-40 bg-blue-500/20 rounded-full blur-2xl animate-float-delayed"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 sm:w-48 h-40 sm:h-48 bg-blue-600/15 rounded-full blur-2xl animate-float-slow"></div>
            </div>
            <div className="absolute top-18 left-1/2 transform -translate-x-1/2 z-10 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-10 h-10  flex items-center justify-center shadow-lg">
                  <img src="/logo.png" alt="ShelfSense Logo" className="h-10 w-20" />
                </div>
                <h1 className="text-5xl font-bold text-white tracking-tight">ShelfVoice</h1>
              </div>
              <p className="text-blue-200 text-sm font-sm">Powered by Gen-T AI Solutions</p>
            </div>
          </div>
          <Card className="w-full max-w-sm sm:max-w-md lg:max-w-lg shadow-2xl rounded-2xl lg:rounded-3xl relative z-10 border-0 bg-white/95 sm:bg-white/98 lg:bg-white backdrop-blur-xl overflow-hidden">
            <CardHeader className="text-center pt-8 sm:pt-10 lg:pt-12 pb-6 lg:pb-8 relative px-6 sm:px-8 lg:px-12">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hidden lg:block"></div>
              <div className="mx-auto mb-6 lg:mb-8 relative hidden lg:block">
                <div className="flex h-16 lg:h-20 w-16 lg:w-20 items-center justify-center rounded-2xl lg:rounded-3xl ">
                  <img src="/logo.png" alt="ShelfSense Logo" className="h-15  w-20  drop-shadow-md" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2 lg:mb-3 tracking-tight">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-slate-600 text-base lg:text-lg font-medium">
                Sign in to access your ShelfVoice dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 sm:px-8 lg:px-12 pb-8 lg:pb-12">
              <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
                <div className="space-y-2 lg:space-y-3">
                  <Label htmlFor="username" className="text-sm lg:text-base font-bold text-slate-700 tracking-wide">
                    Username
                  </Label>
                  <div className="relative group">
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your email address"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="text-base lg:text-lg px-4 lg:px-6 py-3 lg:py-4 border-2 border-slate-200 rounded-xl lg:rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-slate-50/50 hover:bg-white group-hover:border-slate-300"
                    />
                    <div className="absolute inset-0 rounded-xl lg:rounded-2xl bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-focus-within:from-blue-500/10 group-focus-within:via-blue-500/10 group-focus-within:to-blue-500/10 transition-all duration-300 pointer-events-none"></div>
                  </div>
                </div>
                <div className="space-y-2 lg:space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm lg:text-base font-bold text-slate-700 tracking-wide">
                      Password
                    </Label>
                  </div>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="text-base lg:text-lg px-4 lg:px-6 py-3 lg:py-4 pr-12 lg:pr-14 border-2 border-slate-200 rounded-xl lg:rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-slate-50/50 hover:bg-white group-hover:border-slate-300"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 lg:right-3 top-1/2 -translate-y-1/2 h-8 lg:h-10 w-8 lg:w-10 p-0  rounded-lg lg:rounded-xl transition-all duration-200 hover:scale-110"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 lg:h-5 w-4 lg:w-5 text-slate-500" />
                      ) : (
                        <Eye className="h-4 lg:h-5 w-4 lg:w-5 text-slate-500" />
                      )}
                    </Button>
                    <div className="absolute inset-0 rounded-xl lg:rounded-2xl bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-focus-within:from-blue-500/10 group-focus-within:via-blue-500/10 group-focus-within:to-blue-500/10 transition-all duration-300 pointer-events-none"></div>
                  </div>
                </div>
                {error && (
                  <Alert
                    variant="destructive"
                    className="border-red-300 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl lg:rounded-2xl shadow-lg"
                  >
                    <AlertTriangle className="h-4 lg:h-5 w-4 lg:w-5 text-red-600" />
                    <AlertDescription className="text-red-700 font-semibold text-sm lg:text-base">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-bold text-base lg:text-lg shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                  disabled={isLoading}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2 lg:gap-3 relative z-10">
                      <div className="w-4 lg:w-5 h-4 lg:h-5 border-2 lg:border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="font-bold">Signing you in...</span>
                    </span>
                  ) : (
                    <span className="relative z-10 font-bold tracking-wide">Sign In to Dashboard</span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}