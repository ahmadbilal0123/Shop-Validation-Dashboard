"use client"

import { useEffect, useState } from "react"
import { fetchShops, type Shop, type ShopsResponse, updateShopsRadius } from "@/lib/api"
import { fetchUnassignedShops } from "@/lib/api"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

import {
  MapPin,
  Phone,
  Calendar,
  Eye,
  Package,
  Star,
  Search,
  Users,
  RefreshCw,
  ListFilter,
  PlusCircle,
  UserCheck,
  Sparkles,
  CheckCircle,
} from "lucide-react"

const sortByCreated = (a: Shop, b: Shop) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

const sortByAssigned = (a: Shop, b: Shop) =>
  new Date(b.assignedAt || 0).getTime() - new Date(a.assignedAt || 0).getTime()

const RECENT_LIMIT = 10
const SHOPS_PER_PAGE = 50

const FILTERS = [
  {
    value: "all",
    label: "All Shops",
    icon: <ListFilter className="w-4 h-4 mr-2 text-slate-600" />,
    color: "",
  },
  {
    value: "recentAdded",
    label: "Recent Added",
    icon: <Sparkles className="w-4 h-4 mr-2 text-indigo-500" />,
    color: "text-indigo-700",
  },
  {
    value: "recentAssigned",
    label: "Recent Assigned",
    icon: <UserCheck className="w-4 h-4 mr-2 text-green-600" />,
    color: "text-green-700",
  },
  {
    value: "visited",
    label: "Visited Shops",
    icon: <CheckCircle className="w-4 h-4 mr-2 text-green-700" />,
    color: "text-green-700",
  },
] as const

export default function ShopsPage() {
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [allShops, setAllShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [statusFilter] = useState<string | undefined>("all")
  const [cityFilter] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [recentFilter, setRecentFilter] = useState<"all" | "recentAdded" | "recentAssigned" | "visited">("all")
  const selectedFilter = FILTERS.find(f => f.value === recentFilter)!
  const [selectMode, setSelectMode] = useState(false)
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([])
  const [assignLoading] = useState(false)

  // --- RADIUS BUTTON STATE ---
  const [radiusLoading, setRadiusLoading] = useState(false)
  const [radiusEnabled, setRadiusEnabled] = useState<boolean | null>(null)

  // Check if all selected shops have radius enabled
  useEffect(() => {
    if (selectedShopIds.length === 0) {
      setRadiusEnabled(null)
      return
    }
    // The shop object must have a boolean field (like 'thirtyMeterRadius'). Adjust if your field is named differently.
    const selectedShops = shops.filter(shop => selectedShopIds.includes(shop.id))
    if (selectedShops.length === 0) {
      setRadiusEnabled(null)
      return
    }
    const allEnabled = selectedShops.every(shop => !!shop.thirtyMeterRadius)
    setRadiusEnabled(allEnabled)
  }, [selectedShopIds, shops])

  const handleRadiusToggle = async () => {
    if (selectedShopIds.length === 0) {
      alert("Please select at least one shop.")
      return
    }
    setRadiusLoading(true)
    // Always send shopIds as an array
    const shopIdsToSend = selectedShopIds
    const res = await updateShopsRadius(shopIdsToSend, !(radiusEnabled ?? false))
    setRadiusLoading(false)
    if (res.success) {
      await loadShops(selectMode)
    } else {
      alert(res.error || "Failed to update radius")
    }
  }

  const toggleShopSelection = (shopId: string) => {
    setSelectedShopIds((prev) =>
      prev.includes(shopId) ? prev.filter((id) => id !== shopId) : [...prev, shopId]
    )
  }

  const handleSelectAll = () => {
    if (selectedShopIds.length === shops.length) {
      setSelectedShopIds([])
    } else {
      setSelectedShopIds(shops.map((shop) => shop.id))
    }
  }

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev)
    if (selectMode) {
      setSelectedShopIds([])
    }
  }

  const filterShopsBySearch = (shops: Shop[], query: string) => {
    if (!query.trim()) return shops
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

  function applyDropdownFilter(shops: Shop[]) {
    switch(recentFilter) {
      case "recentAdded":
        return [...shops].sort(sortByCreated).slice(0, RECENT_LIMIT)
      case "recentAssigned":
        return [...shops]
          .filter((s) => !!s.assignedAt)
          .sort(sortByAssigned)
          .slice(0, RECENT_LIMIT)
      case "visited":
        return shops.filter((shop) => Array.isArray(shop.visitImages) && shop.visitImages.length > 0)
      default:
        return shops
    }
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
      } else {
        setError(response.error || "Failed to load shops.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filteredShops = filterShopsBySearch(allShops, searchQuery)
    filteredShops = applyDropdownFilter(filteredShops)
    const startIdx = (page - 1) * SHOPS_PER_PAGE
    const endIdx = startIdx + SHOPS_PER_PAGE
    setShops(filteredShops.slice(startIdx, endIdx))
  }, [searchQuery, allShops, recentFilter, page])

  useEffect(() => {
    loadShops(selectMode)
  }, [statusFilter, cityFilter, selectMode])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, recentFilter, selectMode])

  const totalFiltered = applyDropdownFilter(filterShopsBySearch(allShops, searchQuery)).length
  const totalPages = Math.ceil(totalFiltered / SHOPS_PER_PAGE)

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
  }

  const handleClearSearch = () => {
    setSearchQuery("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-blue-100 top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black">
              Admin Shop Management
            </h1>
            <p className="text-black-700 text-sm sm:text-base">
              Efficiently manage and assign shops to auditors
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-xl border border-blue-200">
              <Package className="w-5 h-5 text-black" />
              <span className="font-semibold text-black">{totalFiltered} Total Shops</span>
            </div>
            <div className="flex items-center gap-2 bg-indigo-100 px-4 py-2 rounded-xl border border-indigo-200">
              <Users className="w-5 h-5 text-black" />
              <span className="font-semibold text-black">{selectedShopIds.length} Selected</span>
            </div>
            <Button
              onClick={() => loadShops(selectMode)}
              variant="outline"
              className="flex items-center gap-2 border-blue-200 text-black hover:bg-blue-50"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-lg p-6 mb-8 sticky top-0 z-10">
          <div className="flex flex-wrap gap-4 mb-4 items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 px-4 py-2 border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold rounded-lg shadow transition-all"
                >
                  {selectedFilter.icon}
                  <span className="capitalize">{selectedFilter.label}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 p-1 rounded-xl shadow-lg border border-indigo-100 bg-white/95">
                <DropdownMenuLabel className="text-slate-700 font-semibold px-2 py-1">Filter Shops</DropdownMenuLabel>
                {FILTERS.map((filter) => (
                  <DropdownMenuItem
                    key={filter.value}
                    onSelect={() => setRecentFilter(filter.value as any)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors
                      ${recentFilter === filter.value
                        ? "bg-indigo-100 text-indigo-900 font-bold"
                        : "hover:bg-indigo-50"}
                    `}
                  >
                    {filter.icon}
                    <span className={`capitalize ${filter.color}`}>{filter.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" />
                <Input
                  placeholder="Search shops..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 border-blue-200 focus:ring-black w-full"
                />
                {searchQuery && (
                  <Button
                    type="button"
                    onClick={handleClearSearch}
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                )}
              </form>
            </div>
            {/* Buttons */}
            <div className="flex gap-2 items-center">
              <Button
                onClick={handleRadiusToggle}
                disabled={radiusLoading || selectedShopIds.length === 0}
                className={
                  (radiusEnabled
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                  ) +
                  " text-white flex items-center gap-2"
                }
              >
                {radiusLoading
                  ? "Updating..."
                  : radiusEnabled
                  ? "Disable Radius"
                  : "Enable Radius"}
              </Button>
              <Button
                onClick={() => router.push("/dashboard/shops/create")}
                variant="default"
                className="bg-black text-white flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Create New Shop
              </Button>
              <Button
                onClick={toggleSelectMode}
                variant={selectMode ? "outline" : "default"}
                className={
                  selectMode
                    ? "border-blue-300 text-black hover:bg-blue-50"
                    : "bg-black hover:bg-gray-800 text-white"
                }
              >
                {selectMode ? "Cancel Selection" : "Select Shops"}
              </Button>
              {selectMode && (
                <>
                  <Button
                    onClick={handleSelectAll}
                    variant="outline"
                    className="border-indigo-300 text-black hover:bg-indigo-50"
                  >
                    {selectedShopIds.length === shops.length ? "Deselect All" : "Select All"}
                  </Button>
                  <Button
                    onClick={handleAssignShopsClick}
                    disabled={assignLoading || selectedShopIds.length === 0}
                    className="bg-black hover:bg-black text-white"
                  >
                    {assignLoading
                      ? "Assigning..."
                      : `Assign ${selectedShopIds.length} Shop${selectedShopIds.length !== 1 ? "s" : ""}`}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        {/* ...rest of your component... */}

        {/* Main Content Area - Loading State Check */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600">Loading shops...</span>
          </div>
        ) : error ? (
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
        ) : shops.length === 0 ? (
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
        ) : (
          <>
            {/* Shops Grid */}
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
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleShopSelection(shop.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
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
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                        <div className="text-sm text-slate-600">
                          <span className="font-semibold">Visits:</span>{" "}
                          <span className="text-black font-bold">{shop.visitImages?.length || 0}</span>
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
                        e.stopPropagation();
                        router.push(`/dashboard/shops/${shop.id}`)
                      }}
                      className="w-full mt-4 sm:mt-6 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Shop Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="px-4">
                  Page {page} of {totalPages}
                </span>
                <Button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}