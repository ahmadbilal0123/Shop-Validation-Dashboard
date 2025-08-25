"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { fetchShops, type Shop, type ShopsResponse } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Phone, Mail, Calendar, Star, Filter, Building2, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { fetchVisitStats } from "@/lib/api"  // 👈 import it

export default function RecentShopsPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalShops, setTotalShops] = useState(0)
  const [statusFilter] = useState<string | undefined>("all")
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
        const recentShops = filterRecentShops(response.shops)
        setShops(recentShops)
        setTotalShops(recentShops.length)
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
    setPage(1)
    loadShops()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white/90 backdrop-blur-md border-b border-blue-100/50 top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-700">Admin DashBoard</h1>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Recently Added Shops</h1>
              <p className="text-slate-600 text-base sm:text-lg font-medium">
                Discover newly registered shops from the last 30 days
              </p>
            </div>
            <div className="flex justify-center sm:justify-end">
              <Badge
                variant="outline"
                className="px-4 py-2 bg-blue-50 border-blue-200 text-blue-700 font-semibold"
              >
                <Building2 className="w-4 h-4 mr-2" />
                {totalShops} Total Shops
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Stats Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  {/* Card 1 - Total Shops */}
  <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg hover:shadow-xl transition-all">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-600 uppercase">Total Shops</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{visitStats?.total ?? "..."}</p>
          <p className="text-xs text-slate-500">Last 30 days</p>
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
          <p className="text-sm font-semibold text-slate-600 uppercase">Visited Shops</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">{visitStats?.visited ?? "..."}</p>
        </div>
        <div className="h-12 w-12 sm:h-14 sm:w-14 bg-blue-100 rounded-xl flex items-center justify-center">
          <MapPin className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Card 3 - Not Visited */}
  <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg hover:shadow-xl transition-all">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-600 uppercase">Not Visited</p>
          <p className="text-2xl sm:text-3xl font-bold text-indigo-600">{visitStats?.notVisited ?? "..."}</p>
        </div>
        <div className="h-12 w-12 sm:h-14 sm:w-14 bg-indigo-100 rounded-xl flex items-center justify-center">
          <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600" />
        </div>
      </div>
    </CardContent>
  </Card>
</div>


        {/* Search and Filter Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 w-full">
              <div className="flex-1 relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Search recent shops by name, address, or city..."
                  value={searchQuery || ""}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
                  className="pl-12 h-12 w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-white/70"
                />
              </div>
              <Button
                onClick={handleSearch}
                className="h-12 px-6 sm:px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg w-full lg:w-auto"
              >
                Search
              </Button>
            </div>
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
                  {shop.validationScore && (
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 sm:px-3 sm:py-2 rounded-lg border border-amber-200">
                      <Star className="h-4 w-4 text-amber-500 fill-current" />
                      <span className="text-xs sm:text-sm font-bold text-amber-700">{shop.validationScore}</span>
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
                      <span className="text-sm text-slate-700 font-medium break-words">{shop.email}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    <span className="font-semibold">Visits:</span>{" "}
                    <span className="text-blue-600 font-bold">{shop.visitImages?.length || 0}</span>
                  </div>
                  {shop.lastVisit && (
                    <div className="text-sm text-slate-500">
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
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {!loading && shops.length > 0 && (
          <Card className="border-blue-100 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button
                  onClick={handlePrevPage}
                  disabled={page === 1 || loading}
                  variant="outline"
                  className="bg-white/90 hover:bg-blue-50 border-blue-200 text-blue-700 font-semibold w-full sm:w-auto"
                >
                  Previous
                </Button>

                <div className="text-center space-y-1">
                  <span className="text-slate-700 font-bold text-lg">
                    Page {page} of {Math.ceil(totalShops / limit)}
                  </span>
                  <p className="text-sm text-slate-500">
                    Showing {shops.length} of {totalShops} recent shops
                  </p>
                </div>

                <Button
                  onClick={handleNextPage}
                  disabled={page * limit >= totalShops || loading}
                  variant="outline"
                  className="bg-white/90 hover:bg-blue-50 border-blue-200 text-blue-700 font-semibold w-full sm:w-auto"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
