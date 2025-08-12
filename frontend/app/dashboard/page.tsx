"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { fetchShops, type Shop, type ShopsResponse } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, MapPin, Phone, Mail, Calendar, Star, Package, Filter, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalShops, setTotalShops] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string | undefined>("all")
  const [cityFilter, setCityFilter] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined)

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200"
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Recently Added Shops
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Discover newly added shops from the last 30 days</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="px-3 py-1 bg-white/70">
                <Package className="w-4 h-4 mr-1" />
                {totalShops} Recent Shops
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent Shops</p>
                  <p className="text-2xl font-bold text-gray-900">{totalShops}</p>
                </div>
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cities</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {new Set(shops.map((shop) => shop.city).filter(Boolean)).size}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Visits</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {Math.round(shops.reduce((acc, shop) => acc + (shop.visitCount || 0), 0) / shops.length) || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search recent shops by name, address, or city..."
                value={searchQuery || ""}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch(e)}
                className="pl-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
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
                <SelectTrigger className="w-40 h-12">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Filter by City"
                value={cityFilter || ""}
                onChange={(e) => {
                  setCityFilter(e.target.value)
                  setPage(1)
                }}
                className="w-40 h-12"
              />

              <Button onClick={handleSearch} className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white">
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg">Loading recent shops...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-8 border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg">Error Loading Shops</AlertTitle>
            <AlertDescription className="text-base">{error}</AlertDescription>
          </Alert>
        )}

        {/* No Results State */}
        {!loading && shops.length === 0 && !error && (
          <Card className="text-center py-16 border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent>
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <AlertTitle className="text-xl mb-2">No Recent Shops Found</AlertTitle>
              <AlertDescription className="text-base text-gray-600">
                No shops have been added in the last 30 days, or none match your current search criteria.
              </AlertDescription>
            </CardContent>
          </Card>
        )}

        {/* Shop Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {shops.map((shop) => (
            <Card
              key={shop.id}
              className="bg-white/70 backdrop-blur-sm border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">{shop.name}</CardTitle>
                    <Badge className={`${getStatusColor(shop.status)} text-xs font-medium`}>
                      {shop.status?.toUpperCase()}
                    </Badge>
                  </div>
                  {shop.validationScore && (
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-yellow-700">{shop.validationScore}</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Address - Enhanced to show name and address prominently */}
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{shop.address || "No address provided"}</p>
                      <p>
                        {shop.city && shop.state
                          ? `${shop.city}, ${shop.state}`
                          : shop.city || shop.state || "Location not specified"}
                      </p>
                      {shop.zipCode && <p>{shop.zipCode}</p>}
                      {shop.ptc_urbanity && <p className="text-xs text-gray-500">Urbanity: {shop.ptc_urbanity}</p>}
                      {shop.city_village && <p className="text-xs text-gray-500">Village: {shop.city_village}</p>}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-col gap-2">
                    {shop.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{shop.phone}</span>
                      </div>
                    )}
                    {shop.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{shop.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Visit Stats */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Visits:</span> {shop.visitCount || 0}
                    </div>
                    {shop.lastVisit && (
                      <div className="text-sm text-gray-500">Last: {new Date(shop.lastVisit).toLocaleDateString()}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm text-indigo-600 font-medium">
                      Added: {shop.createdAt ? new Date(shop.createdAt).toLocaleDateString() : "Unknown"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {shops.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏪</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No recent shops found</h3>
            <p className="text-gray-500">No shops have been added in the last 30 days</p>
          </div>
        )}

        {/* Pagination */}
        {!loading && shops.length > 0 && (
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button
                  onClick={handlePrevPage}
                  disabled={page === 1 || loading}
                  variant="outline"
                  className="bg-white/80 hover:bg-white"
                >
                  Previous
                </Button>

                <div className="text-center">
                  <span className="text-gray-700 font-medium">
                    Page {page} of {Math.ceil(totalShops / limit)}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    Showing {shops.length} of {totalShops} recent shops
                  </p>
                </div>

                <Button
                  onClick={handleNextPage}
                  disabled={page * limit >= totalShops || loading}
                  variant="outline"
                  className="bg-white/80 hover:bg-white"
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
