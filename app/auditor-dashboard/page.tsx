"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchAssignedShopsForAuditor, type Shop, type AssignedShopsResponse } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Star,
  Filter,
  Building2,
  UserCheck,
  TrendingUp,
  Home,
  FileText,
  Settings,
  LogOut,
  User,
  BarChart3,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function AuditorDashboard() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalShops, setTotalShops] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string | undefined>("all")
  const [cityFilter, setCityFilter] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined)
  const [auditorId, setAuditorId] = useState<string | null>(null)
  const router = useRouter()

  // Check session and set auditorId
  useEffect(() => {
    const checkSession = () => {
      const sessionData = localStorage.getItem("session")
      if (!sessionData) {
        router.push("/login")
        return
      }
      try {
        const session = JSON.parse(sessionData)
        if (new Date() >= new Date(session.expiresAt)) {
          localStorage.removeItem("session")
          router.push("/login")
          return
        }
        const userRole = session.user?.role || session.role
        if (userRole !== "auditor") {
          router.push("/dashboard")
          return
        }
        const extractedAuditorId = session.user?.id || session.userId || session.id
        setAuditorId(extractedAuditorId)
      } catch (error) {
        localStorage.removeItem("session")
        router.push("/login")
      }
    }
    checkSession()
    // eslint-disable-next-line
  }, [router])

  // Load assigned shops when auditorId or filters change
  useEffect(() => {
    const loadAssignedShops = async () => {
      if (!auditorId) return
      setLoading(true)
      setError(null)
      try {
        const response: AssignedShopsResponse = await fetchAssignedShopsForAuditor(auditorId, {
          status: statusFilter === "all" ? undefined : statusFilter,
          city: cityFilter,
          search: searchQuery,
          page,
          limit,
        })
        if (response.success) {
          setShops(response.shops)
          setTotalShops(response.total || response.shops.length)
        } else {
          setError(response.error || "Failed to load assigned shops.")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.")
      } finally {
        setLoading(false)
      }
    }
    loadAssignedShops()
  }, [auditorId, page, limit, statusFilter, cityFilter, searchQuery])




  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    // loadAssignedShops() is not needed here, useEffect will trigger
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "inactive":
        return "bg-red-50 text-red-700 border-red-200"
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "assigned":
        return "bg-blue-50 text-blue-700 border-blue-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getPriorityShops = () => {
    return shops.filter((shop) => shop.status === "pending" || !shop.lastVisit)
  }

  const handleLogout = () => {
    localStorage.removeItem("session")
    document.cookie = "session=; path=/; max-age=0"
    router.push("/login")
  }

  if (!auditorId && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>Please log in to access your auditor dashboard.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <div className="flex h-full w-64 flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 shadow-2xl">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b border-slate-700/50 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Auditor Portal
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-6">
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-white bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-slate-600/50 shadow-lg shadow-blue-500/10 transition-all duration-200"
            >
              <Home className="mr-3 h-5 w-5" />
              <span className="font-medium">Assigned Shops</span>
              <div className="ml-auto w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
            </Button>

            {/* <Button
              variant="ghost"
              className="w-full justify-start h-12 text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-200 border border-transparent hover:border-slate-600/50 backdrop-blur-sm"
            >
              <Building2 className="mr-3 h-5 w-5" />
              <span className="font-medium">Assigned Shops</span>
            </Button> */}
{/* 
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-200 border border-transparent hover:border-slate-600/50 backdrop-blur-sm"
            >
              <BarChart3 className="mr-3 h-5 w-5" />
              <span className="font-medium">Reports</span>
            </Button> */}

            {/* <Button
              variant="ghost"
              className="w-full justify-start h-12 text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-200 border border-transparent hover:border-slate-600/50 backdrop-blur-sm"
            >
              <FileText className="mr-3 h-5 w-5" />
              <span className="font-medium">Audit History</span>
            </Button> */}

            {/* <Button
              variant="ghost"
              className="w-full justify-start h-12 text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-200 border border-transparent hover:border-slate-600/50 backdrop-blur-sm"
            >
              <User className="mr-3 h-5 w-5" />
              <span className="font-medium">Profile</span>
            </Button> */}

            {/* <Button
              variant="ghost"
              className="w-full justify-start h-12 text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-200 border border-transparent hover:border-slate-600/50 backdrop-blur-sm"
            >
              <Settings className="mr-3 h-5 w-5" />
              <span className="font-medium">Settings</span>
            </Button> */}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-slate-700/50 p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm">
            <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-600/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Auditor</p>
                  <p className="text-xs text-slate-400 capitalize bg-gradient-to-r from-blue-400/80 to-purple-400/80 bg-clip-text text-transparent font-medium">
                    auditor
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start bg-gradient-to-r from-red-600/20 to-red-500/20 border-red-500/30 text-red-300 hover:text-white hover:bg-gradient-to-r hover:from-red-600/40 hover:to-red-500/40 hover:border-red-400/50 transition-all duration-200"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <SidebarInset>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header Section */}
            <div className="bg-white/90 backdrop-blur-md border-b border-blue-100/50 top-0 z-40 shadow-sm">
              <div className="container mx-auto px-6 py-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <SidebarTrigger className="h-8 w-8" />
                    <div className="space-y-2">
                      <h1 className="text-4xl font-bold text-slate-900">Auditor Dashboard</h1>
                      <p className="text-slate-600 text-lg font-medium">Manage your assigned shops and audit tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="outline"
                      className="px-4 py-2 bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      {totalShops} Assigned Shops
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="container mx-auto px-6 py-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Total Assigned</p>
                        <p className="text-3xl font-bold text-slate-900">{totalShops}</p>
                        <p className="text-xs text-slate-500">Shops to audit</p>
                      </div>
                      <div className="h-14 w-14 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Building2 className="h-7 w-7 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Priority Tasks</p>
                        <p className="text-3xl font-bold text-blue-600">{getPriorityShops().length}</p>
                        <p className="text-xs text-slate-500">Pending audits</p>
                      </div>
                      <div className="h-14 w-14 bg-blue-100 rounded-xl flex items-center justify-center">
                        <AlertCircle className="h-7 w-7 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Completed</p>
                        <p className="text-3xl font-bold text-green-600">
                          {shops.filter((shop) => shop.lastVisit).length}
                        </p>
                        <p className="text-xs text-slate-500">Audited shops</p>
                      </div>
                      <div className="h-14 w-14 bg-green-100 rounded-xl flex items-center justify-center">
                        <UserCheck className="h-7 w-7 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Avg. Score</p>
                        <p className="text-3xl font-bold text-indigo-600">
                          {shops.length > 0
                            ? (
                                shops.reduce((acc, shop) => acc + (shop.validationScore || 0), 0) / shops.length
                              ).toFixed(1)
                            : "0.0"}
                        </p>
                        <p className="text-xs text-slate-500">Validation score</p>
                      </div>
                      <div className="h-14 w-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-7 w-7 text-indigo-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filter Section */}
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg mb-8">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="flex-1 relative">
                      <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                      <Input
                        placeholder="Search assigned shops by name, address, or city..."
                        value={searchQuery || ""}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
                        className="pl-12 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-white/70"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Select
                        value={statusFilter || "all"}
                        onValueChange={(value) => {
                          setStatusFilter(value === "all" ? "all" : value)
                          setPage(1)
                        }}
                      >
                        <SelectTrigger className="w-40 h-12 bg-white/70">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="Filter by City"
                        value={cityFilter || ""}
                        onChange={(e) => {
                          setCityFilter(e.target.value)
                          setPage(1)
                        }}
                        className="w-40 h-12 bg-white/70"
                      />

                      <Button
                        onClick={handleSearch}
                        className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
                      >
                        Search
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-20">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
                  <p className="text-slate-600 text-lg font-medium">Loading assigned shops...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <Alert variant="destructive" className="mb-8 border-red-200 bg-red-50/80 backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="text-lg font-semibold">Error Loading Assigned Shops</AlertTitle>
                  <AlertDescription className="text-base">{error}</AlertDescription>
                </Alert>
              )}

              {/* No Results State */}
              {!loading && shops.length === 0 && !error && (
                <Card className="text-center py-20 border-blue-100 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent>
                    <UserCheck className="w-20 h-20 mx-auto mb-6 text-slate-400" />
                    <AlertTitle className="text-2xl font-bold text-slate-700 mb-3">No Assigned Shops Found</AlertTitle>
                    <AlertDescription className="text-lg text-slate-600 max-w-md mx-auto">
                      You don't have any shops assigned for audit yet, or none match your current search criteria.
                    </AlertDescription>
                  </CardContent>
                </Card>
              )}

              {/* Shop Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {shops.map((shop) => (
                  <Card
                    key={shop.id}
                    className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {shop.name}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Badge className={`${getStatusColor(shop.status)} text-xs font-semibold px-3 py-1`}>
                              {shop.status?.toUpperCase()}
                            </Badge>
                            {!shop.lastVisit && (
                              <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs font-semibold px-3 py-1">
                                PRIORITY
                              </Badge>
                            )}
                          </div>
                        </div>
                        {shop.validationScore && (
                          <div className="flex items-center gap-1 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                            <Star className="h-4 w-4 text-amber-500 fill-current" />
                            <span className="text-sm font-bold text-amber-700">{shop.validationScore}</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-4">
                      {/* Address */}
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-slate-700 space-y-1">
                          <p className="font-semibold">{shop.address || "No address provided"}</p>
                          <p className="text-slate-600">
                            {shop.city && shop.state
                              ? `${shop.city}, ${shop.state}`
                              : shop.city || shop.state || "Location not specified"}
                          </p>
                          {shop.zipCode && <p className="text-slate-500">{shop.zipCode}</p>}
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-3">
                        {shop.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-slate-700 font-medium">{shop.phone}</span>
                          </div>
                        )}
                        {shop.email && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-slate-700 font-medium">{shop.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Assignment & Visit Info */}
                      <div className="space-y-3 pt-3 border-t border-slate-200">
                        {shop.assignedAt && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-blue-600 font-semibold">
                              Assigned: {new Date(shop.assignedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-600">
                            <span className="font-semibold">Visits:</span>{" "}
                            <span className="text-blue-600 font-bold">{shop.visitCount || 0}</span>
                          </div>
                          {shop.lastVisit && (
                            <div className="text-sm text-green-600 font-medium">
                              Last: {new Date(shop.lastVisit).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* View Data Button */}
                      <Button
                        size="sm"
                        onClick={() => router.push(`/auditor-dashboard/shops/${shop.id}`)}
                        className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Shop Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

          

            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
