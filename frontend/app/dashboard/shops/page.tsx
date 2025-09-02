"use client"

import { useEffect, useState } from "react"
import { fetchShops, type Shop, type ShopsResponse } from "@/lib/api"
import { fetchUnassignedShops } from "@/lib/api"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  MapPin,
  Phone,
  Calendar,
  Eye,
  Package,
  Star,
  Search,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
} from "lucide-react"

export default function ShopsPage() {
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [allShops, setAllShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page] = useState(1)
  const [totalShops, setTotalShops] = useState(0)
  const [statusFilter] = useState<string | undefined>("all")
  const [cityFilter] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState<string>("")
  // Visited filter state: true = show only visited shops, false = show all
  const [showVisitedOnly, setShowVisitedOnly] = useState(false)
  // Always reset to all shops on mount
  useEffect(() => {
    setShowVisitedOnly(false)
  }, [])

  // Selection state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([])
  const [assignLoading] = useState(false)

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

  const loadShops = async (selecting: boolean = false) => {
    setLoading(true)
    setError(null)
    try {
      let response: ShopsResponse

      if (selecting) {
        response = await fetchUnassignedShops({
          city: cityFilter,
          page,
        })
      } else {
        response = await fetchShops({
          status: statusFilter,
          city: cityFilter,
          page,
        })
      }

      if (response.success) {
        setAllShops(response.shops)
        // By default, show only visited shops (visitImages.length > 0)
        const visitedShops = response.shops.filter((shop) => Array.isArray(shop.visitImages) && shop.visitImages.length > 0)
        let filteredShops = filterShopsBySearch(showVisitedOnly ? visitedShops : response.shops, searchQuery)
        
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

  // Apply search filter and visited filter when search query or visited toggle changes
  useEffect(() => {
    if (allShops.length > 0) {
      const visitedShops = allShops.filter((shop) => Array.isArray(shop.visitImages) && shop.visitImages.length > 0)
      let filteredShops = filterShopsBySearch(showVisitedOnly ? visitedShops : allShops, searchQuery)
      
      // Sort so latest added/updated shops appear first
      filteredShops = filteredShops.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime()
        const dateB = new Date(b.updatedAt || b.createdAt).getTime()
        return dateB - dateA
      })
      
      setShops(filteredShops)
      setTotalShops(filteredShops.length)
    }
  }, [searchQuery, allShops, showVisitedOnly])

  // Initial load
  useEffect(() => {
    loadShops(selectMode)
  }, [page, statusFilter, cityFilter, selectMode, showVisitedOnly])

  const toggleShopSelection = (shopId: string) => {
    setSelectedShopIds((prev) => (prev.includes(shopId) ? prev.filter((id) => id !== shopId) : [...prev, shopId]))
  }

  const handleSelectAll = () => {
    if (selectedShopIds.length === shops.length) {
      setSelectedShopIds([])
    } else {
      setSelectedShopIds(shops.map((shop) => shop.id))
    }
  }

  const handleAssignShopsClick = async () => {
    if (selectedShopIds.length === 0) {
      alert("Please select at least one shop.")
      return
    }

    const shopIdsParam = selectedShopIds.join(",")
    router.push(`/dashboard/shops/assign?shopIds=${shopIdsParam}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search happens automatically via useEffect, this is just for form submission
  }

  const handleClearSearch = () => {
    setSearchQuery("")
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "in-progress":
        return <AlertCircle className="w-4 h-4 text-blue-600" />
      default:
        return <Package className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-blue-100 top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            <div className="space-y-2 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-900">
                Admin Shop Management
              </h1>
              <p className="text-blue-700 text-sm sm:text-base">
                Efficiently manage and assign shops to auditors with our streamlined dashboard
              </p>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-end gap-3 sm:gap-4">
              <div className="flex items-center gap-2 bg-blue-100 px-3 sm:px-4 py-2 rounded-xl border border-blue-200 text-sm sm:text-base">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
                <span className="font-semibold text-blue-800">{totalShops} Total Shops</span>
              </div>

              <div className="flex items-center gap-2 bg-indigo-100 px-3 sm:px-4 py-2 rounded-xl border border-indigo-200 text-sm sm:text-base">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-700" />
                <span className="font-semibold text-indigo-800">{selectedShopIds.length} Selected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters + Actions Section */}
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-lg p-4 sm:p-6 mb-8 z-50">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search Input & Visited Toggle */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
              {/* Visited/All toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={showVisitedOnly ? "default" : "outline"}
                  className={showVisitedOnly ? "bg-green-600 hover:bg-green-700 text-white" : "border-green-300 text-green-700 hover:bg-green-50"}
                  onClick={() => setShowVisitedOnly(true)}
                >
                  Visited Shops
                </Button>
                <Button
                  variant={!showVisitedOnly ? "default" : "outline"}
                  className={!showVisitedOnly ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-blue-300 text-blue-700 hover:bg-blue-50"}
                  onClick={() => setShowVisitedOnly(false)}
                >
                  All Shops
                </Button>
              </div>
              <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4" />
                <Input
                  placeholder="Search shops by name, city, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400 w-full"
                />
                {searchQuery && (
                  <Button
                    type="button"
                    onClick={handleClearSearch}
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-100 text-slate-500"
                  >
                    ×
                  </Button>
                )}
              </form>
              
              {/* Search Results Info */}
              {searchQuery && !loading && (
                <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                  <Filter className="h-4 w-4" />
                  <span>
                    {shops.length > 0 
                      ? `Found ${shops.length} shop${shops.length === 1 ? '' : 's'} matching "${searchQuery}"`
                      : `No shops found matching "${searchQuery}"`
                    }
                  </span>
                  <Button
                    onClick={handleClearSearch}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2 hover:bg-blue-100"
                  >
                    ×
                  </Button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-end w-full lg:w-auto">
              <Button
                onClick={() => {
                  setSelectMode((prev) => !prev)
                  setSelectedShopIds([]) // reset selection
                }}
                variant={selectMode ? "outline" : "default"}
                className={
                  selectMode
                    ? "border-blue-300 text-blue-700 hover:bg-blue-50"
                    : "bg-blue-700 hover:bg-blue-800 text-white"
                }
              >
                {selectMode ? "Cancel Selection" : "Select Shops"}
              </Button>

              {selectMode && (
                <Button
                  onClick={handleSelectAll}
                  variant="outline"
                  className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 bg-transparent"
                >
                  {selectedShopIds.length === shops.length ? "Deselect All" : "Select All"}
                </Button>
              )}

              {selectMode && (
                <Button
                  onClick={handleAssignShopsClick}
                  disabled={assignLoading || selectedShopIds.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                >
                  {assignLoading
                    ? "Assigning..."
                    : `Assign ${selectedShopIds.length} Shop${selectedShopIds.length !== 1 ? "s" : ""}`}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading shops...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-red-50 border-red-200 shadow-lg">
            <CardContent className="py-8 text-center">
              <p className="text-red-600 font-semibold">{error}</p>
              <Button 
                onClick={() => loadShops(selectMode)} 
                className="mt-4 bg-red-600 hover:bg-red-700"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No Results Message */}
        {!loading && !error && shops.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg">
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                {searchQuery ? "No Shops Found" : "No Shops Available"}
              </h3>
              <p className="text-slate-500">
                {searchQuery 
                  ? `No shops match your search for "${searchQuery}". Try adjusting your search terms.`
                  : selectMode 
                    ? "No unassigned shops available for selection."
                    : "No shops have been added yet."
                }
              </p>
              {searchQuery && (
                <Button 
                  onClick={handleClearSearch}
                  variant="outline"
                  className="mt-4"
                >
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Shops Grid */}
        {!loading && !error && shops.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {shops.map((shop) => (
              <Card
                key={shop.id}
                className={`group relative bg-white/90 backdrop-blur-sm border border-blue-100 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 ${
                  selectedShopIds.includes(shop.id) ? "ring-2 ring-blue-400 shadow-lg scale-[1.02]" : ""
                } ${selectMode ? "cursor-pointer" : ""}`}
                onClick={selectMode ? () => toggleShopSelection(shop.id) : undefined}
              >
                {selectMode && (
                  <div className="absolute top-4 right-4 z-10">
                    <input
                      type="checkbox"
                      checked={selectedShopIds.includes(shop.id)}
                      onChange={() => toggleShopSelection(shop.id)}
                      className="w-5 h-5 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                    />
                  </div>
                )}

                <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/80 to-slate-50/80">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-800 transition-colors">
                        {shop.name}
                      </CardTitle>
                    </div>
                    {shop.validationScore !== undefined && (
                      <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-50 to-amber-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-yellow-200 shadow-sm">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-bold text-yellow-700">{shop.validationScore.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0 p-4 sm:p-6 space-y-4">
                  <div className="space-y-3">
                    {shop.address && (
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-slate-700 space-y-1">
                          <p className="font-semibold">{shop.address}</p>
                          <p className="text-slate-600">
                            {shop.city && shop.state
                              ? `${shop.city}, ${shop.state}`
                              : shop.city || shop.state || "Location not specified"}
                          </p>
                          {shop.zipCode && <p className="text-slate-500">{shop.zipCode}</p>}
                        </div>
                      </div>
                    )}

                    {!shop.address && shop.city && (
                      <div className="flex items-center text-gray-600 group-hover:text-gray-800 transition-colors">
                        <MapPin className="w-4 h-4 mr-3 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-medium">{shop.city}</span>
                      </div>
                    )}

                    {shop.phone && (
                      <div className="flex items-center text-gray-600 group-hover:text-gray-800 transition-colors">
                        <Phone className="w-4 h-4 mr-3 text-indigo-500 flex-shrink-0" />
                        <span className="text-sm">{shop.phone}</span>
                      </div>
                    )}

                   

                    {shop.createdAt && (
                      <div className="flex items-center text-gray-600 group-hover:text-gray-800 transition-colors">
                        <Calendar className="w-4 h-4 mr-3 text-amber-500 flex-shrink-0" />
                        <span className="text-sm">Added {new Date(shop.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Visit Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
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
                  </div>

                  <Button
                    size="sm"
                    onClick={(e) => {
                      if (selectMode) {
                        e.stopPropagation() // Prevent card click when in select mode
                      }
                      router.push(`/dashboard/shops/${shop.id}`)
                    }}
                    className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
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