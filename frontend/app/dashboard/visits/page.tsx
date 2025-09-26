"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Search, Eye, Store, TrendingUp, Users, RefreshCw } from "lucide-react"
import { fetchVisitedShops, type Shop } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function VisitsPage() {
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")

  // Selection state with persistence
  const [selectMode, setSelectMode] = useState(false)
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([])
  const [assignLoading] = useState(false)

  // Clear any persisted selections when leaving the page
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('selectedShopIds_visits')
      sessionStorage.removeItem('selectMode_visits')
    }
  }, [])

  // Do not persist selection or mode across navigations

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
    // Sort so latest added shops appear first (by createdAt or updatedAt desc)
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime()
      const dateB = new Date(b.updatedAt || b.createdAt).getTime()
      return dateB - dateA
    })
    
  // Calculate stats
  const totalVisits = shops.reduce((sum, shop) => sum + (shop.visitImages?.length || 0), 0)

  useEffect(() => {
    loadVisitedShops()
  }, [])

  const loadVisitedShops = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetchVisitedShops()

      if (response.success) {
        setShops(response.shops)
      } else {
        setError(response.error || "Failed to load visited shops")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Error loading visited shops:", err)
    } finally {
      setLoading(false)
    }
  }

  // Refresh function - exactly like other pages
  const refreshVisits = async () => {
    await loadVisitedShops()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Selection handlers
  const handleShopSelection = (shopId: string) => {
    setSelectedShopIds((prev) => {
      if (prev.includes(shopId)) {
        return prev.filter((id) => id !== shopId)
      } else {
        return [...prev, shopId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedShopIds.length === filteredShops.length) {
      setSelectedShopIds([])
    } else {
      setSelectedShopIds(filteredShops.map((shop) => shop.id))
    }
  }

const handleAssignShopsClick = async () => {
  if (selectedShopIds.length === 0) {
    alert("Please select at least one shop.")
    return
  }

  const shopIdsParam = selectedShopIds.join(",")
  // Changed from /dashboard/visit-assign/assign to /dashboard/visit-assign
  router.push(`/dashboard/visit-assign?shopIds=${shopIdsParam}`)
}

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            <span className="ml-3 text-gray-700">Loading visits...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-4xl mx-auto pt-20">
          <Card className="border-gray-200 bg-gray-50/70 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-gray-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Visits</h3>
              <p className="text-gray-700 mb-6">{error}</p>
              <Button
                onClick={loadVisitedShops}
                variant="outline"
                className="border-gray-300 text-gray-800 hover:bg-gray-100 bg-transparent"
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
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
      <div className="w-full p-4 md:p-6 space-y-8">
        <div className="text-center space-y-4 py-8">
          {/* <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-100 rounded-full mb-4">
            <Store className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">ShelfSense</span>
          </div> */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 text-balance text-center">Your Shop Visits</h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto text-pretty mt-4">
                This are The shops you have visited so far. You can select multiple shops to assign them to a QC user.
              </p>
            </div>
            
            {/* Refresh Button */}
            <Button
              onClick={refreshVisits}
              variant="outline"
              className="flex items-center gap-2 border-gray-300 text-gray-800 hover:bg-gray-100 w-full sm:w-auto"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Shops</p>
                  <p className="text-3xl font-bold text-slate-900">{shops.length}</p>
                  <p className="text-xs text-slate-500">Shops visited</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center  transition-colors">
                  <Store className="h-6 w-6 text-gray-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Visits</p>
                  <p className="text-3xl font-bold text-slate-900">{totalVisits}</p>
                  <p className="text-xs text-slate-500">Visit records</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center transition-colors">
                  <Eye className="h-6 w-6 text-gray-800" />
                </div>
              </div>
            </CardContent>
          </Card>

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

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg sticky top-0 z-10">
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

              {/* Right section - All buttons + Filter */}
              <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-end w-full lg:w-auto">
                {selectMode && (
                  <Button
                    onClick={handleSelectAll}
                    variant="outline"
                    className="text-gray-800 hover:bg-gray-100 bg-transparent w-full sm:w-auto"
                  >
                    {selectedShopIds.length === filteredShops.length ? "Deselect All" : "Select All"}
                  </Button>
                )}

                <Button
                  onClick={() => {
                    setSelectMode((prev) => !prev)
                    if (selectMode) {
                      // Only clear selections when explicitly canceling
                      setSelectedShopIds([])
                      sessionStorage.removeItem('selectedShopIds_visits')
                      sessionStorage.removeItem('selectMode_visits')
                    }
                  }}
                  variant={selectMode ? "outline" : "default"}
                  className={
                    selectMode
                      ? " text-gray-800 hover:bg-gray-200 w-full sm:w-auto"
                      : "bg-black hover:bg-gray-800 text-white w-full sm:w-auto"
                  }
                >
                  {selectMode ? "Cancel" : "Select Shops"}
                </Button>

                {selectMode && (
                  <Button
                    onClick={handleAssignShopsClick}
                    disabled={assignLoading || selectedShopIds.length === 0}
                    className="bg-black hover:bg-gray-900 text-white disabled:opacity-50 w-full sm:w-auto"
                  >
                    {assignLoading
                      ? "Assigning..."
                      : `Assign ${selectedShopIds.length} Shop${selectedShopIds.length !== 1 ? "s" : ""}`}
                  </Button>
                )}

                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-full sm:w-48 border-slate-200 bg-white/50">
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
                  : "Start visiting shops to see them appear here."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShops.map((shop) => {
              const isSelected = selectedShopIds.includes(shop.id)
              return (
                <Card
                  key={shop.id}
                  className={`group hover:shadow-xl transition-all duration-300 border-0 backdrop-blur-sm hover:bg-white/90 cursor-pointer ${
                    selectMode
                      ? isSelected
                        ? "bg-gray-100/80 ring-2 ring-gray-700 shadow-lg"
                        : "bg-white/70 hover:bg-gray-100/70"
                      : "bg-white/70"
                  }`}
                  onClick={() => {
                    if (selectMode) {
                      handleShopSelection(shop.id)
                    }
                  }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-black-100 transition-colors">
                          {shop.name}
                        </CardTitle>
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
                          <span className="line-clamp-2 leading-relaxed">{shop.address}</span>
                        </div>
                      </div>
                      {/* Selection indicator */}
                      {selectMode && (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          isSelected 
                            ? "bg-black border-black" 
                            : "border-slate-300 bg-white"
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">City</span>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        {shop.city || "Unknown"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Total Visits</span>
                      <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                        {shop.visitImages?.length || 0} visits
                      </Badge>
                    </div>

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
                        if (selectMode) {
                          e.stopPropagation() // Prevent card click when in select mode
                        }
                        router.push(`/dashboard/shops/${shop.id}`)
                      }}
                      className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-900 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Shop Details
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}