"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchShopById } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, MapPin, Phone, TrendingUp, Star, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ShopData {
  [key: string]: any
}

export default function ShopDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const shopId = params.id as string

  const [shop, setShop] = useState<ShopData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadShopData = async () => {
      if (!shopId) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetchShopById(shopId)

        if (response.success && response.data) {
          setShop(response.data)
        } else {
          setError(response.error || "Failed to load shop data")
        }
      } catch (err) {
        console.error("Error loading shop data:", err)
        setError(err instanceof Error ? err.message : "Failed to load shop data")
      } finally {
        setLoading(false)
      }
    }

    loadShopData()
  }, [shopId])

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

  const formatFieldName = (key: string): string => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined) return "Not provided"
    if (typeof value === "object") return JSON.stringify(value, null, 2)
    if (typeof value === "boolean") return value ? "Yes" : "No"
    return String(value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="bg-white/90 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 border-indigo-200 text-indigo-700 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shops
              </Button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {shop ? shop.shop_name || shop.name || "Shop Details" : "Shop Details"}
                </h1>
                <p className="text-gray-600 mt-1">Detailed information and analytics</p>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Auditors
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-100 border-t-indigo-600 mx-auto mb-8 shadow-lg"></div>
            <p className="text-gray-600 text-xl font-medium">Loading shop details...</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-8 border-red-200 bg-red-50 rounded-xl">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg">Error Loading Shop</AlertTitle>
            <AlertDescription className="text-base">{error}</AlertDescription>
          </Alert>
        )}

        {shop && !loading && (
          <div className="space-y-8">
            {/* Shop Overview Card */}
            <Card className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-white/30 shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
                      {shop.shop_name || shop.name || "Shop Details"}
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      <Badge
                        className={`${getStatusColor(shop.status || shop.shop_status)} text-sm font-bold px-4 py-2 rounded-full shadow-sm`}
                      >
                        {(shop.status || shop.shop_status || "UNKNOWN").toUpperCase()}
                      </Badge>
                      {(shop.rating || shop.validation_score || shop.validationScore) && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-2 rounded-xl border border-yellow-200 shadow-sm">
                          <Star className="h-5 w-5 text-yellow-500 fill-current" />
                          <span className="text-lg font-bold text-yellow-700">
                            {(shop.rating || shop.validation_score || shop.validationScore)?.toFixed?.(2) ||
                              shop.rating ||
                              shop.validation_score ||
                              shop.validationScore}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Location Information */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="h-6 w-6 text-indigo-500" />
                      Location Details
                    </h3>

                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-600 mb-1">Address</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {shop.address || shop.shop_address || "Not provided"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl">
                          <p className="text-sm font-medium text-gray-600 mb-1">City</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {shop.city || shop.city_village || "Not provided"}
                          </p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl">
                          <p className="text-sm font-medium text-gray-600 mb-1">State</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {shop.state || shop.ptc_urbanity || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact & Analytics */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Phone className="h-6 w-6 text-green-500" />
                      Contact & Analytics
                    </h3>

                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-600 mb-1">Phone</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {shop.phone || shop.contact_number || shop.mobile_number || "Not provided"}
                        </p>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {shop.email || shop.contact_email || "Not provided"}
                        </p>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-600 mb-1">Total Visits</p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-red-500" />
                          <p className="text-2xl font-bold text-gray-900">
                            {shop.visitCount || shop.visit_count || shop.total_visits || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Complete Data Table */}
            <Card className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-white/30 shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                <CardTitle className="text-2xl font-bold text-gray-900">Complete Shop Data</CardTitle>
                <p className="text-gray-600">All {Object.keys(shop).length} fields from API response</p>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
                        <th className="border-b border-gray-200 px-6 py-4 text-left font-bold text-gray-700 text-lg">
                          Field
                        </th>
                        <th className="border-b border-gray-200 px-6 py-4 text-left font-bold text-gray-700 text-lg">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(shop).map(([key, value], index) => (
                        <tr
                          key={index}
                          className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50 transition-all duration-200"
                        >
                          <td className="border-b border-gray-100 px-6 py-4 font-semibold text-gray-600 text-base">
                            {formatFieldName(key)}
                          </td>
                          <td className="border-b border-gray-100 px-6 py-4 text-gray-900 text-base">
                            {key.toLowerCase().includes("status") ? (
                              <Badge className={`${getStatusColor(String(value))} font-bold`}>
                                {String(value).toUpperCase()}
                              </Badge>
                            ) : (
                              <span className="font-medium">{formatFieldValue(value)}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
