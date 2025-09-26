"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Search, Eye, Store, TrendingUp, RefreshCw } from "lucide-react"
import { fetchPendingAndVisitedShops, type Shop } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function PendingShopsPage() {
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")

  // Get unique cities for filter
  const uniqueCities = Array.from(new Set(shops.map((shop) => shop.city).filter(Boolean)))

  // Filter shops based on search and filters
  const filteredShops = shops
    .filter((shop) => {
      const matchesSearch =
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.address.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || shop.status === statusFilter
      const matchesCity = cityFilter === "all" || shop.city === cityFilter
      return matchesSearch && matchesStatus && matchesCity
    })
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime()
      const dateB = new Date(b.updatedAt || b.createdAt).getTime()
      return dateB - dateA
    })

  // Calculate stats
  const totalVisits = shops.reduce((sum, shop) => sum + (shop.visitImages?.length || 0), 0)

  useEffect(() => {
    loadPendingShops()
  }, [])

  const loadPendingShops = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetchPendingAndVisitedShops()

      if (response.success) {
        setShops(response.shops)
      } else {
        setError(response.error || "Failed to load pending shops")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Error loading pending shops:", err)
    } finally {
      setLoading(false)
    }
  }

  // Refresh function - exactly like other pages
  const refreshPending = async () => {
    await loadPendingShops()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 p-4 md:p-6">
        <div className="w-full">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600">Loading pending shops...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 p-4 md:p-6">
        <div className="w-full pt-20">
          <Card className="border-red-200 bg-red-50/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to Load Pending Shops</h3>
              <p className="text-red-700 mb-6">{error}</p>
              <Button
                onClick={loadPendingShops}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 bg-transparent"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50">
      <div className="w-full p-4 md:p-6 space-y-8">
        <div className="text-center space-y-4 py-8">
          {/* <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-100 rounded-full mb-4">
            <Store className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">ShelfVoice</span>
          </div> */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 text-balance">Pending Shops</h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto text-pretty mt-4">
                This Are the shops that are pending for review. You can search and filter through the list to find specific shops.
              </p>
              {/* Mobile refresh under text */}
              <div className="mt-3 block sm:hidden">
                <Button
                  onClick={refreshPending}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
            
            {/* Refresh Button (desktop/tablet) */}
            <Button
              onClick={refreshPending}
              variant="outline"
              className="hidden sm:flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Pending Shops</p>
                  <p className="text-3xl font-bold text-slate-900">{shops.length}</p>
                  <p className="text-xs text-slate-500">Shops pending</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center transition-colors">
                  <Store className="h-6 w-6 text-black" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Visits</p>
                  <p className="text-3xl font-bold text-slate-900">{totalVisits}</p>
                  <p className="text-xs text-slate-500">Visit records</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <Eye className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card> */}

          {/* <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Avg per Shop</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {shops.length > 0 ? (totalVisits / shops.length).toFixed(1) : "0"}
                  </p>
                  <p className="text-xs text-slate-500">Visits per shop</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Left section - Search field */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search shops by name or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-200 bg-white/50 focus:bg-white transition-colors"
                />
              </div>

              {/* Right section - Filter */}
              <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-end w-full lg:w-auto">
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-48 border-slate-200 bg-white/50">
                    <SelectValue placeholder="Filter by city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {uniqueCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredShops.length === 0 ? (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-3">No shops found</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                {searchTerm || statusFilter !== "all" || cityFilter !== "all"
                  ? "Try adjusting your search terms or filters to find what you're looking for."
                  : "No pending shops at the moment."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShops.map((shop) => (
              <Card
                key={shop.id}
                className="group hover:shadow-xl transition-all duration-300 border-0 backdrop-blur-sm hover:bg-white/90 cursor-pointer bg-white/70"
                onClick={() => router.push(`/dashboard/shops/${shop.id}`)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                        {shop.name}
                      </CardTitle>
                      <div className="flex items-start gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
                        <span className="line-clamp-2 leading-relaxed">{shop.address}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">City</span>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                      {shop.city || "Unknown"}
                    </Badge>
                  </div>

                  {/* <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Status</span>
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
                      {shop.status}
                    </Badge>
                  </div> */}

                  {shop.lastVisit && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Last Visit
                      </span>
                      <span className="text-sm font-medium text-slate-700">{formatDate(shop.lastVisit)}</span>
                    </div>
                  )}

                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/dashboard/shops/${shop.id}`)
                    }}
                    className="w-full mt-4 sm:mt-6  text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Shop Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}