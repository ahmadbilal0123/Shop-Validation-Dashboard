"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Calendar,  Search, Eye } from "lucide-react"
import { fetchVisitedShops, type Shop } from "@/lib/api"

export default function VisitsPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("")

  // Get unique cities for filter
  const uniqueCities = Array.from(new Set(shops.map((shop) => shop.city).filter(Boolean)))

  // Filter shops based on search and filters
  const filteredShops = shops.filter((shop) => {
    const matchesSearch =
      shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || shop.status === statusFilter
    const matchesCity = !cityFilter || shop.city === cityFilter
    return matchesSearch && matchesStatus && matchesCity
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

  

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading visited shops...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadVisitedShops} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Shop Visits
          </h1>
          <p className="text-gray-600 text-lg">Track and manage all visited shops with their images</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Total Shops</p>
                  <p className="text-2xl font-bold">{shops.length}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black text-sm">Total Visits</p>
                  <p className="text-2xl font-bold">{totalVisits}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search shops by name or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
             <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full md:w-48">
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
          </CardContent>
        </Card>

        {/* Shops Grid */}
        {filteredShops.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No visited shops found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all" || cityFilter
                  ? "Try adjusting your filters to see more results."
                  : "No shops have been visited yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShops.map((shop) => (
              <Card
                key={shop.id}
                className="hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-800 mb-1">{shop.name}</CardTitle>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="truncate">{shop.address}</span>
                      </div>
                    </div>
                   
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  

                  {/* Shop Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">City:</span>
                      <span className="font-medium">{shop.city || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Visits:</span>
                      <span className="font-medium text-blue-600">{shop.visitImages?.length || 0}</span>
                    </div>
                    {shop.lastVisit && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Visit:</span>
                        <span className="font-medium">{formatDate(shop.lastVisit)}</span>
                      </div>
                    )}
                  </div>

                  {/* <Button
                    className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    onClick={() => (window.location.href = `/shop/${shop.id}`)}
                  >
                    View Details
                  </Button> */}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
