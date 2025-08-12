"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { fetchShops, type Shop, type ShopsResponse } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, MapPin, Phone, Mail, Calendar, TrendingUp, Package, Eye, Filter, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

export default function ShopsPage() {
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalShops, setTotalShops] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string | undefined>("all")
  const [cityFilter, setCityFilter] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined)

  const loadShops = async () => {
    setLoading(true)
    setError(null)
    try {
      const response: ShopsResponse = await fetchShops({
        status: statusFilter,
        city: cityFilter,
        search: searchQuery,
      })

      if (response.success) {
        setShops(response.shops)
        setTotalShops(response.total)
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

  const handleViewData = (shopId: string) => {
    router.push(`/dashboard/shops/${shopId}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadShops()
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
      case "inactive":
        return "bg-red-100 text-red-700 border-red-200"
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                All Shops
              </h1>
            </div>
            <Badge
              variant="outline"
              className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-700 font-semibold"
            >
              <Package className="w-4 h-4 mr-2" />
              {totalShops} Shops
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-gradient-to-r from-white/80 via-white/70 to-indigo-50/50 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <form onSubmit={handleSearch} className="col-span-full md:col-span-2 lg:col-span-2 flex gap-2">
              <div className="flex-1 relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search by name or address..."
                  value={searchQuery || ""}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white/80 font-medium rounded-xl shadow-sm"
                />
              </div>
              <Button
                type="submit"
                className="h-12 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Search
              </Button>
            </form>

            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => {
                setStatusFilter(value === "all" ? undefined : value)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-12 bg-white/80 border-indigo-200 rounded-xl shadow-sm">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="text"
              placeholder="Filter by City"
              value={cityFilter || ""}
              onChange={(e) => {
                setCityFilter(e.target.value)
                setPage(1)
              }}
              className="h-12 bg-white/80 border-indigo-200 rounded-xl shadow-sm"
            />
          </div>
        </div>

        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-100 border-t-indigo-600 mx-auto mb-8 shadow-lg"></div>
            <p className="text-gray-600 text-xl font-medium">Loading shops...</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-8 border-red-200 bg-red-50 rounded-xl">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg">Error Loading Shops</AlertTitle>
            <AlertDescription className="text-base">{error}</AlertDescription>
          </Alert>
        )}

        {!loading && shops.length === 0 && !error && (
          <Card className="text-center py-16 border-0 shadow-lg bg-white/70 backdrop-blur-sm rounded-2xl">
            <CardContent>
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <AlertTitle className="text-xl mb-2">No Shops Found</AlertTitle>
              <AlertDescription className="text-base text-gray-600">
                No shops match your current criteria. Try adjusting your filters.
              </AlertDescription>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {shops.map((shop) => (
            <Card
              key={shop.id}
              className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-white/30 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 rounded-2xl overflow-hidden"
            >
              <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-gray-900 mb-3 leading-tight">{shop.name}</CardTitle>
                    <Badge
                      className={`${getStatusColor(shop.status)} text-xs font-bold px-3 py-1 rounded-full shadow-sm`}
                    >
                      {shop.status?.toUpperCase()}
                    </Badge>
                  </div>
                  {shop.validationScore !== undefined && (
                    <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-50 to-amber-50 px-3 py-2 rounded-xl border border-yellow-200 shadow-sm">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-bold text-yellow-700">{shop.validationScore.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0 p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl">
                    <MapPin className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-700">
                      <p className="font-bold text-gray-900 mb-1">{shop.address || "No address provided"}</p>
                      <p className="font-medium">
                        {shop.city && shop.state
                          ? `${shop.city}, ${shop.state}`
                          : shop.city || shop.state || "Location not specified"}
                        {shop.zipCode && ` ${shop.zipCode}`}
                      </p>
                    </div>
                  </div>

                  {shop.phone && (
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <Phone className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-700">{shop.phone}</span>
                    </div>
                  )}
                  {shop.email && (
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <Mail className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-700">{shop.email}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-gray-600">
                        Created: {new Date(shop.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-gray-700">Visits: {shop.visitCount}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleViewData(shop.id)}
                    className="w-full mt-6 h-12 border-2 border-indigo-200 text-indigo-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 bg-white/80 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                    variant="outline"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    View Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && shops.length > 0 && (
          <Card className="mt-8 border-0 shadow-xl bg-gradient-to-r from-white/80 to-indigo-50/50 backdrop-blur-sm rounded-2xl">
            <CardContent className="py-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                <Button
                  onClick={handlePrevPage}
                  disabled={page === 1 || loading}
                  variant="outline"
                  className="bg-white/90 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 border-indigo-200 text-indigo-700 font-semibold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Previous
                </Button>

                <div className="text-center">
                  <span className="text-gray-800 font-bold text-lg">
                    Page {page} of {Math.ceil(totalShops / limit)} ({totalShops} shops)
                  </span>
                </div>

                <Button
                  onClick={handleNextPage}
                  disabled={page * limit >= totalShops || loading}
                  variant="outline"
                  className="bg-white/90 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 border-indigo-200 text-indigo-700 font-semibold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
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
