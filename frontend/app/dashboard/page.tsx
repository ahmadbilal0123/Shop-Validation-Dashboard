"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { fetchShops, fetchInvalidGPSShops, type Shop, type ShopsResponse } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Calendar, Star, Filter, Building2, Clock, CheckCircle2, RefreshCw, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { fetchVisitStats } from "@/lib/api"

export default function RecentShopsPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalShops, setTotalShops] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string | undefined>("visited")
  const [cityFilter] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined)
  const [visitStats, setVisitStats] = useState<{ visited: number; notVisited: number; total: number } | null>(null)
  const [invalidGPSShops, setInvalidGPSShops] = useState<Shop[]>([])
  const [invalidGPSLoading, setInvalidGPSLoading] = useState(false)

  const loadStats = async () => {
    const response = await fetchVisitStats()
    if (response.success) {
      setVisitStats({
        visited: response.visited || 0,
        notVisited: response.notVisited || 0,
        total: response.total || 0,
      })
    }
  }

  const loadInvalidGPSShops = async () => {
    setInvalidGPSLoading(true)
    try {
      const response = await fetchInvalidGPSShops()
      if (response.success) {
        setInvalidGPSShops(response.shops)
      }
    } catch (error) {
      console.error("Error loading invalid GPS shops:", error)
    } finally {
      setInvalidGPSLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    loadInvalidGPSShops()
  }, [])

  const filterRecentShops = (shops: Shop[]) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return shops.filter((shop) => {
      if (!shop.createdAt) return false
      const createdDate = new Date(shop.createdAt)
      return createdDate >= thirtyDaysAgo
    })
  }

  const filterVisitedShops = (shops: Shop[]) => {
    return shops.filter((shop) => {
      return shop.visit === true
    })
  }

  const filterShopsBySearch = (shops: Shop[], query: string) => {
    if (!query || query.trim() === "") return shops
    const searchTerm = query.toLowerCase().trim()
    return shops.filter((shop) => {
      const name = shop.name?.toLowerCase() || ""
      const address = shop.address?.toLowerCase() || ""
      const city = shop.city?.toLowerCase() || ""
      const state = shop.state?.toLowerCase() || ""
      const phone = shop.phone?.toLowerCase() || ""
      return (
        name.includes(searchTerm) ||
        address.includes(searchTerm) ||
        city.includes(searchTerm) ||
        state.includes(searchTerm) ||
        phone.includes(searchTerm)
      )
    })
  }

  const loadShopsData = async () => {
    setError(null)
    const response: ShopsResponse = await fetchShops({
      status: statusFilter === "all" ? undefined : statusFilter,
      city: cityFilter,
      search: searchQuery,
    })
    if (response.success) {
      let filteredShops = response.shops
      
      if (statusFilter === "visited") {
        // For visited shops: only apply visited filter (no 30-day filter)
        filteredShops = filterVisitedShops(filteredShops)
      } else {
        // For all shops: apply 30-day filter first
        filteredShops = filterRecentShops(filteredShops)
      }
      
      if (searchQuery && searchQuery.trim() !== "") {
        filteredShops = filterShopsBySearch(filteredShops, searchQuery)
      }
      filteredShops = filteredShops.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime()
        const dateB = new Date(b.updatedAt || b.createdAt).getTime()
        return dateB - dateA
      })
      setShops(filteredShops)
      setTotalShops(filteredShops.length)
    } else {
      setError(response.error || "Failed to load shops.")
    }
  }

  const loadShops = async () => {
    setLoading(true)
    try {
      await loadShopsData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
    }
    setLoading(false)
  }

  useEffect(() => {
    loadShops()
  }, [page, limit, statusFilter, cityFilter, searchQuery])

  const handleNextPage = () => {
    if (page * limit < totalShops) setPage((prev) => prev + 1)
  }
  const handlePrevPage = () => {
    if (page > 1) setPage((prev) => prev - 1)
  }
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadShops()
  }
  const handleClearSearch = () => {
    setSearchQuery("")
    setPage(1)
  }
  const refreshDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const response: ShopsResponse = await fetchShops({
        status: statusFilter === "all" ? undefined : statusFilter,
        city: cityFilter,
        search: searchQuery,
      })
      if (response.success) {
        let filteredShops = response.shops
        
        if (statusFilter === "visited") {
          // For visited shops: only apply visited filter (no 30-day filter)
          filteredShops = filterVisitedShops(filteredShops)
        } else {
          // For all shops: apply 30-day filter first
          filteredShops = filterRecentShops(filteredShops)
        }
        
        if (searchQuery && searchQuery.trim() !== "") {
          filteredShops = filterShopsBySearch(filteredShops, searchQuery)
        }
        filteredShops = filteredShops.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt).getTime()
          const dateB = new Date(b.updatedAt || b.createdAt).getTime()
          return dateB - dateA
        })
        setShops(filteredShops)
        setTotalShops(filteredShops.length)
      } else {
        setError(response.error || "Failed to load shops.")
      }
      await loadStats()
      await loadInvalidGPSShops()
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred.")
    }
    setLoading(false)
  }

  const assignedShops = shops.filter((shop) => shop.assignedTo)
  const pendingShops = shops.filter(
    (shop) => shop.assignedTo && shop.visit !== true,
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Curved border for header */}
      <div className="bg-white border-b border-gray-300 z-40 shadow-lg rounded-t-2xl sm:rounded-t-3xl">
        <div className="w-full px-2 sm:px-4 py-4 sm:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 mb-4">
            <div className="w-full">
              <div className="min-w-0 text-center">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-black truncate">
                  Admin Dashboard
                </h1>
                <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-gray-800 truncate">
                  Recently Visited Shops
                </h2>
                <p className="text-gray-600 text-xs sm:text-base lg:text-lg font-medium">
                  Showing Recently Visited Shops in the Last 30 Days
                </p>
                {/* Mobile refresh under text */}
                <div className="mt-3 block sm:hidden">
                  <Button
                    onClick={refreshDashboard}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 border-gray-300 bg-white text-black hover:bg-gray-50 hover:border-gray-400"
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button
                onClick={refreshDashboard}
                variant="outline"
                className="w-full sm:w-auto flex items-center justify-center gap-2 border-gray-300 bg-white text-black hover:bg-gray-50 hover:border-gray-400"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                <span className="sm:inline">Refresh</span>
              </Button>
              <Badge
                variant="outline"
                className="w-full sm:w-auto justify-center px-4 py-2 bg-black border-black text-white font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {totalShops} Visited Shops
              </Badge>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full px-2 sm:px-4 py-4 sm:py-8">
        {/* Responsive grid for stats cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-gray-300">
  <CardContent className="p-4 sm:p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-1 flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase truncate">
          Total Shops
        </p>
        <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-black">{visitStats?.total ?? shops.length}</p>
        <p className="text-xs sm:text-sm text-gray-500 truncate">All registered shops</p>
      </div>
      <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-gray-200">
        <Building2 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-black" />
      </div>
    </div>
  </CardContent>
</Card>
          <Card className="bg-white border-2 border-gray-300 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-gray-400">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase truncate">
                    Visited Shops
                  </p>
                  <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-black">
                    {visitStats?.visited ?? 0}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Successfully visited</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-gray-200">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-black" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-gray-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase truncate">
                    Assigned Shops
                  </p>
                  <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-black">{assignedShops.length}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-gray-200">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-black" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-red-200 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-red-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-red-600 uppercase truncate">
                    Invalid GPS
                  </p>
                  <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-red-600">
                    {invalidGPSLoading ? "..." : invalidGPSShops.length}
                  </p>
                  <p className="text-xs sm:text-sm text-red-500 truncate">GPS validation failed</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-red-200">
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border-2 border-gray-200 shadow-lg mb-6 sm:mb-8">
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4 w-full">
              <div className="flex-1 relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search visited shops by name, address, city, state, or phone..."
                  value={searchQuery || ""}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 w-full border-2 border-gray-200 focus:border-black focus:ring-black bg-white text-black placeholder:text-gray-500"
                />
                {searchQuery && (
                  <Button
                    type="button"
                    onClick={handleClearSearch}
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 text-gray-500 hover:text-black"
                  >
                    ×
                  </Button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <Button
                  type="submit"
                  className="flex-1 lg:flex-none h-12 px-6 sm:px-8 bg-black hover:bg-gray-800 text-white font-semibold shadow-lg transition-colors"
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Search"}
                </Button>
                {searchQuery && (
                  <Button
                    type="button"
                    onClick={handleClearSearch}
                    variant="outline"
                    className="h-12 px-4 border-2 border-gray-200 hover:bg-gray-50 text-black bg-transparent"
                    disabled={loading}
                  >
                    Clear
                  </Button>
                )}
                <Select
                  value={statusFilter || "all"}
                  onValueChange={(value) => {
                    setPage(1)
                    setStatusFilter(value === "all" ? undefined : value)
                  }}
                >
                  <SelectTrigger className="w-full sm:w-32 h-12 border-2 border-gray-200 bg-white font-semibold text-black">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="visited">Visited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
            {searchQuery && !loading && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                <p className="text-xs sm:text-sm text-black">
                  {shops.length > 0
                    ? `Found ${shops.length} visited shop${shops.length === 1 ? "" : "s"} matching "${searchQuery}"`
                    : `No visited shops found matching "${searchQuery}"`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <span className="ml-3 text-black font-medium">Loading dashboard...</span>
          </div>
        ) : error ? (
          <Card className="bg-white border-2 border-red-200 shadow-lg">
            <CardContent className="py-8 text-center">
              <p className="text-red-600 font-semibold">{error}</p>
              <Button onClick={() => loadShops()} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {shops.map((shop) => (
                <Card
                  key={shop.id}
                  className="bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 group hover:border-gray-300"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-black group-hover:text-gray-700 transition-colors flex-1 min-w-0">
                        {/* Shop name wraps on multiple lines for readability */}
                        <span className="block break-words whitespace-normal">{shop.name}</span>
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {shop.visit === true ? (
                          <Badge className="bg-black text-white border-black text-xs sm:text-sm">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Visited
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-black border-gray-300 text-xs sm:text-sm">
                            <Clock className="w-3 h-3 mr-1" />
                            Unvisited
                          </Badge>
                        )}
                        {shop.validationScore && (
                          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 sm:px-3 sm:py-2 rounded-lg border-2 border-gray-200">
                            <Star className="h-4 w-4 text-gray-600 fill-current" />
                            <span className="text-xs sm:text-sm font-bold text-black">{shop.validationScore}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4 flex flex-col h-full justify-between">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <MapPin className="h-5 w-5 text-black mt-0.5 flex-shrink-0" />
                      <div className="text-xs sm:text-sm lg:text-base text-black space-y-1 flex-1 min-w-0">
                        <p className="font-semibold break-words">{shop.address || "No address provided"}</p>
                        <p className="text-gray-600 break-words">
                          {shop.city && shop.state
                            ? `${shop.city}, ${shop.state}`
                            : shop.city || shop.state || "Location not specified"}
                        </p>
                        {shop.zipCode && <p className="text-gray-500 break-words">{shop.zipCode}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-gray-200">
                      <div className="text-xs sm:text-sm text-gray-600">
                        <span className="font-semibold">Visits:</span>{" "}
                        <span className="text-black font-bold">{shop.visitImages?.length || 0}</span>
                      </div>
                      {shop.lastVisit && (
                        <div className="text-xs sm:text-sm text-black font-semibold">
                          Last: {new Date(shop.lastVisit).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                      <Calendar className="h-4 w-4 text-black" />
                      <span className="text-xs sm:text-sm text-black font-semibold">
                        Added: {shop.createdAt ? new Date(shop.createdAt).toLocaleDateString() : "Unknown"}
                      </span>
                    </div>
                    <div className="mt-4 flex-1" />
                    <Button
                      size="sm"
                      onClick={() => (window.location.href = `/dashboard/shops/${shop.id}`)}
                      className="w-full bg-black hover:bg-gray-800 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-sm"
                    >
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      View Shop Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}