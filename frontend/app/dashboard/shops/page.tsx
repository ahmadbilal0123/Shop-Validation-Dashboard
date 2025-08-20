"use client"

import { useEffect, useState } from "react"
import { fetchShops, type Shop, type ShopsResponse } from "@/lib/api"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
  MapPin,
  Phone,
  Mail,
  Calendar,
  Eye,
  Package,
  Star,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react"

export default function ShopsPage() {
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page] = useState(1)
  const [limit] = useState(10)
  const [totalShops, setTotalShops] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string | undefined>("all")
  const [cityFilter] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined)

  // Selection state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([])
  const [assignLoading] = useState(false)

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

  useEffect(() => {
    loadShops()
  }, [page, limit, statusFilter, cityFilter, searchQuery])

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

  const areShopsAlreadyAssigned = (selectedShopIds: string[], auditorId: string) => {
    return shops
      .filter((shop) => selectedShopIds.includes(shop.id))
      .some((shop) => shop.auditorId === auditorId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-blue-100  top-0 z-40 shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-blue-900 ">Auditor Shop Management</h1>
              <p className="text-blue-700 ">
                Efficiently manage and assign shops to auditors with our streamlined dashboard
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-xl border border-blue-200">
                <Package className="w-5 h-5 text-blue-700" />
                <span className="font-semibold text-blue-800">{totalShops} Total Shops</span>
              </div>

              <div className="flex items-center gap-2 bg-indigo-100 px-4 py-2 rounded-xl border border-indigo-200">
                <Users className="w-5 h-5 text-indigo-700" />
                <span className="font-semibold text-indigo-800">{selectedShopIds.length} Selected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions Section */}
      <div className="container mx-auto px-6 py-6 ">
       <div className="sticky top-0 bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-lg p-6 mb-8 z-50">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center  justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4" />
                <Input
                  placeholder="Search shops by name, city, or email..."
                  value={searchQuery || ""}
                  onChange={(e) => setSearchQuery(e.target.value || undefined)}
                  className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 border-blue-200 focus:border-blue-400">
                  <Filter className="w-4 h-4 mr-2 text-blue-500" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setSelectMode((prev) => !prev)}
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
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-medium">Error loading shops: {error}</p>
            </div>
          </div>
        )}

        {/* Shops Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <Card
                key={shop.id}
                className={`group relative bg-white/90 backdrop-blur-sm border border-blue-100 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 ${
                  selectedShopIds.includes(shop.id) ? "ring-2 ring-blue-400 shadow-lg transform scale-[1.02]" : ""
                }`}
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
                      <CardTitle className="text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-800 transition-colors">
                        {shop.name}
                      </CardTitle>
                      {shop.status && (
                        <Badge className={`${getStatusBadgeColor(shop.status)} border font-medium`}>
                          {getStatusIcon(shop.status)}
                          <span className="ml-1 capitalize">{shop.status}</span>
                        </Badge>
                      )}
                    </div>
                    {shop.validationScore !== undefined && (
                      <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-50 to-amber-50 px-3 py-2 rounded-xl border border-yellow-200 shadow-sm">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-bold text-yellow-700">{shop.validationScore.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0 p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600 group-hover:text-gray-800 transition-colors">
                      <MapPin className="w-4 h-4 mr-3 text-blue-500 flex-shrink-0" />
                      <span className="text-sm font-medium">{shop.city || "Location not specified"}</span>
                    </div>

                    {shop.phone && (
                      <div className="flex items-center text-gray-600 group-hover:text-gray-800 transition-colors">
                        <Phone className="w-4 h-4 mr-3 text-indigo-500 flex-shrink-0" />
                        <span className="text-sm">{shop.phone}</span>
                      </div>
                    )}

                    {shop.email && (
                      <div className="flex items-center text-gray-600 group-hover:text-gray-800 transition-colors">
                        <Mail className="w-4 h-4 mr-3 text-slate-500 flex-shrink-0" />
                        <span className="text-sm truncate">{shop.email}</span>
                      </div>
                    )}

                    {shop.createdAt && (
                      <div className="flex items-center text-gray-600 group-hover:text-gray-800 transition-colors">
                        <Calendar className="w-4 h-4 mr-3 text-amber-500 flex-shrink-0" />
                        <span className="text-sm">Added {new Date(shop.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => router.push(`/dashboard/shops/${shop.id}`)}
                    className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Shop Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && shops.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No shops found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
          </div>
        )}

    
      </div>
    </div>
  )
}
