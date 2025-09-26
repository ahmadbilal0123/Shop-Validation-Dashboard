"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Phone, Mail, Search, RefreshCw, Store, Calendar, TrendingUp } from "lucide-react"
import { fetchShops, type Shop } from "@/lib/api"
import { formatRelativeTime } from "@/lib/utils"

interface ShopsListProps {
  onShopSelect?: (shop: Shop) => void
}

export function ShopsList({ onShopSelect }: ShopsListProps) {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalShops, setTotalShops] = useState(0)

  const loadShops = async (page = 1, search = "", status = "all") => {
    setLoading(true)
    setError("")

    try {
      const params: any = {
        page,
        limit: 12,
      }

      if (search) params.search = search
      if (status !== "all") params.status = status

      const response = await fetchShops(params)

      if (response.success) {
        setShops(response.shops)
        
      } else {
        setError(response.error || "Failed to load shops")
        setShops([])
      }
    } catch (err) {
      setError("Network error. Please try again.")
      setShops([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadShops(1, searchTerm, statusFilter)
  }, [searchTerm, statusFilter])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    loadShops(currentPage, searchTerm, statusFilter)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getValidationScoreColor = (score?: number) => {
    if (!score) return "text-gray-500"
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading && shops.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading shops...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Shops</h2>
          <p className="text-gray-600">
            {totalShops} shop{totalShops !== 1 ? "s" : ""} found
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={loading} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search shops by name, address, or city..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilter("all")}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilter("active")}
          >
            Active
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilter("pending")}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === "inactive" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilter("inactive")}
          >
            Inactive
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Shops Grid */}
      {shops.length === 0 && !loading ? (
        <div className="text-center py-12">
          <Store className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shops found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "No shops available at the moment"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <Card
              key={shop.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onShopSelect?.(shop)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{shop.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {shop.city}, {shop.state}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(shop.status)}>{shop.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p className="truncate">{shop.address}</p>
                  <p>{shop.zipCode}</p>
                </div>

                {(shop.phone || shop.email) && (
                  <div className="space-y-1">
                    {shop.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {shop.phone}
                      </div>
                    )}
                    {shop.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {shop.email}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    {shop.visitCount} visit{shop.visitCount !== 1 ? "s" : ""}
                  </div>
                  {shop.validationScore && (
                    <div className={`flex items-center font-medium ${getValidationScoreColor(shop.validationScore)}`}>
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {shop.validationScore}%
                    </div>
                  )}
                </div>

                {shop.lastVisit && (
                  <div className="text-xs text-gray-500">Last visit: {formatRelativeTime(shop.lastVisit)}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalShops > 12 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1 || loading}
            onClick={() => loadShops(currentPage - 1, searchTerm, statusFilter)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600 px-4">
            Page {currentPage} of {Math.ceil(totalShops / 12)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= Math.ceil(totalShops / 12) || loading}
            onClick={() => loadShops(currentPage + 1, searchTerm, statusFilter)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
