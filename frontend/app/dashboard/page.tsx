"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { fetchShops, type Shop, type ShopsResponse } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Phone, Mail, Calendar, Star, Filter, Building2,Clock,CheckCircle2, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { fetchVisitStats } from "@/lib/api"  // 👈 import it

export default function RecentShopsPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalShops, setTotalShops] = useState(0)
  // Set initial filter to 'visited' so only visited shops show by default
  const [statusFilter, setStatusFilter] = useState<string | undefined>("visited")
  const [cityFilter] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined)
const [visitStats, setVisitStats] = useState<{ visited: number; notVisited: number; total: number } | null>(null)

useEffect(() => {
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
  loadStats()
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

  // Filter only visited shops
  const filterVisitedShops = (shops: Shop[]) => {
    return shops.filter((shop) => {
      // Check if shop has visits (visitImages array length > 0 or lastVisit exists)
      return (shop.visitImages && shop.visitImages.length > 0) || shop.lastVisit
    })
  }

  // Filter shops based on search query
  const filterShopsBySearch = (shops: Shop[], query: string) => {
    if (!query || query.trim() === '') return shops
    
    const searchTerm = query.toLowerCase().trim()
    
    return shops.filter((shop) => {
      const name = shop.name?.toLowerCase() || ''
      const address = shop.address?.toLowerCase() || ''
      const city = shop.city?.toLowerCase() || ''
      const state = shop.state?.toLowerCase() || ''
      const phone = shop.phone?.toLowerCase() || ''
      
      return (
        name.includes(searchTerm) ||
        address.includes(searchTerm) ||
        city.includes(searchTerm) ||
        state.includes(searchTerm) ||
        phone.includes(searchTerm)
      )
    })
  }

  const loadShops = async () => {
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
        filteredShops = filterRecentShops(filteredShops)
        if (statusFilter === "visited") {
          filteredShops = filterVisitedShops(filteredShops)
        }
        if (searchQuery && searchQuery.trim() !== '') {
          filteredShops = filterShopsBySearch(filteredShops, searchQuery)
        }
        
        // Sort so latest added/updated shops appear first
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
    } catch (err) {
      console.error("Error loading shops:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadShops()
  }, [page, limit, statusFilter, cityFilter, searchQuery])


  const handleNextPage = () => {
    if (page * limit < totalShops) {
      setPage((prev) => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1) // Reset to first page when searching
    loadShops() // Reload shops with current search query
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    setPage(1)
    // The useEffect will automatically trigger loadShops when searchQuery changes
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white/90 backdrop-blur-md border-b border-blue-100/50 top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-700">Admin DashBoard</h1>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Recently Visited Shops</h1>
              <p className="text-slate-600 text-base sm:text-lg font-medium">
                Showing Recently Visited Shops in the Last 30 Days
              </p>
            </div>
            <div className="flex justify-center sm:justify-end">
              <Badge
                variant="outline"
                className="px-4 py-2 bg-blue-50 border-blue-200 text-blue-700 font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {totalShops} Visited Shops
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Stats Cards - Only show Total and Visited */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  {/* Card 1 - Total Shops */}
  <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg hover:shadow-xl transition-all">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-600 uppercase">Total Shops</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{visitStats?.total ?? "..."}</p>
          <p className="text-xs text-slate-500">All registered shops</p>
        </div>
        <div className="h-12 w-12 sm:h-14 sm:w-14 bg-blue-100 rounded-xl flex items-center justify-center">
          <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Card 2 - Visited Shops */}
  <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg hover:shadow-xl transition-all">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-blue-600 uppercase">Visited Shops</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">{visitStats?.visited ?? "..."}</p>
          <p className="text-xs text-blue-500">Successfully visited</p>
        </div>
     <div className="h-12 w-12 sm:h-14 sm:w-14 bg-blue-100 rounded-xl flex items-center justify-center">
  <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
</div>
      </div>
    </CardContent>
  </Card>

   <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg hover:shadow-xl transition-all">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-600 uppercase">Pending Shops</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">{visitStats?.notVisited ?? "..."}</p>
        </div>
        <div className="h-12 w-12 sm:h-14 sm:w-14 bg-blue-100 rounded-xl flex items-center justify-center">
  <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
</div>

      </div>
    </CardContent>
  </Card>
</div>

        {/* Search and Filter Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4 w-full">
              <div className="flex-1 relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Search visited shops by name, address, city, state, or phone..."
                  value={searchQuery || ""}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-white/70"
                />
                {searchQuery && (
                  <Button
                    type="button"
                    onClick={handleClearSearch}
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-100"
                  >
                    ×
                  </Button>
                )}
              </div>
              <div className="flex gap-2 w-full lg:w-auto items-center">
                <Button
                  type="submit"
                  className="flex-1 lg:flex-none h-12 px-6 sm:px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Search"}
                </Button>
                {searchQuery && (
                  <Button
                    type="button"
                    onClick={handleClearSearch}
                    variant="outline"
                    className="h-12 px-4 border-slate-200 hover:bg-slate-50"
                    disabled={loading}
                  >
                    Clear
                  </Button>
                )}
                {/* Filter Dropdown for Visited/Unvisited */}
                <Select 
                  value={statusFilter || "all"} 
                  onValueChange={(value) => {
                    setPage(1);
                    setStatusFilter(value === "all" ? undefined : value);
                  }}
                >
                  <SelectTrigger className="w-32 h-12 border-slate-200 bg-white font-semibold">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="visited">Visited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
            
            {/* Search Results Info */}
            {searchQuery && !loading && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  {shops.length > 0 
                    ? `Found ${shops.length} visited shop${shops.length === 1 ? '' : 's'} matching "${searchQuery}"`
                    : `No visited shops found matching "${searchQuery}"`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shop Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {shops.map((shop) => (
            <Card
              key={shop.id}
              className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg hover:shadow-xl transition-all group"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {shop.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {(Array.isArray(shop.visitImages) && shop.visitImages.length > 0) || shop.lastVisit ? (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Visited
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Unvisited
                      </Badge>
                    )}
                    {shop.validationScore && (
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 sm:px-3 sm:py-2 rounded-lg border border-amber-200">
                        <Star className="h-4 w-4 text-amber-500 fill-current" />
                        <span className="text-xs sm:text-sm font-bold text-amber-700">{shop.validationScore}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-4 flex flex-col h-full justify-between">
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
              

                {/* Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    <span className="font-semibold">Visits:</span>{" "}
                    <span className="text-blue-600 font-bold">{shop.visitImages?.length || 0}</span>
                  </div>
                  {shop.lastVisit && (
                    <div className="text-sm text-blue-600 font-semibold">
                      Last: {new Date(shop.lastVisit).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-xs sm:text-sm text-blue-600 font-semibold">
                    Added: {shop.createdAt ? new Date(shop.createdAt).toLocaleDateString() : "Unknown"}
                  </span>
                </div>

                <div className="mt-4 flex-1" />
                <Button
                  size="sm"
                  onClick={() => window.location.href = `/dashboard/shops/${shop.id}`}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  View Shop Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results Message */}
        {!loading && shops.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No Visited Shops Found</h3>
              <p className="text-slate-500">
                {searchQuery ? "Try adjusting your search criteria." : "No shops have been visited in the last 30 days."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading visited shops...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-red-50 border-red-200 shadow-lg">
            <CardContent className="py-8 text-center">
              <p className="text-red-600 font-semibold">{error}</p>
              <Button 
                onClick={loadShops} 
                className="mt-4 bg-red-600 hover:bg-red-700"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}