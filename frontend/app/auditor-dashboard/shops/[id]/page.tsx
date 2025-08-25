"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchShopById } from "@/lib/api"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, MapPin, Phone, Star, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

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
  const [showPreviousImages, setShowPreviousImages] = useState(false)

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

  const formatFieldName = (key: string) =>
    key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")

  const formatFieldValue = (value: any) => {
    if (value === null || value === undefined) return "Not provided"
    if (typeof value === "object") return JSON.stringify(value, null, 2)
    if (typeof value === "boolean") return value ? "Yes" : "No"
    return String(value)
  }

  const getLatestImages = () => {
    if (!shop?.visitImages?.length) return []
    return shop.visitImages.slice(-1) // Get the last uploaded images
  }

  const getPreviousImages = () => {
    if (!shop?.visitImages?.length) return []
    return shop.visitImages.slice(0, -1).reverse() // Get all except last, reverse for latest first
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {shop?.shop_name || shop?.name || "Shop Details"}
              </h1>
              <p className="text-gray-600 mt-1 text-sm">Detailed information & analytics</p>
            </div>
          </div>
          {/* <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Auditors
          </Button> */}
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
          <Alert variant="destructive" className="mb-8 rounded-xl">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg">Error Loading Shop</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {shop && !loading && (
          <div className="space-y-8">
            {/* Shop Overview */}
            <Card className="bg-white/80 backdrop-blur-sm border border-white/30 shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
                      {shop.shop_name || shop.name || "Shop Details"}
                    </CardTitle>
                    {(shop.rating || shop.validation_score || shop.validationScore) && (
                      <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-2 rounded-xl border border-yellow-200 shadow-sm">
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <span className="text-lg font-bold text-yellow-700">
                          {(shop.rating || shop.validation_score || shop.validationScore)?.toFixed?.(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Location */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-indigo-500" />
                    Location
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl">
                      <p className="text-sm font-medium text-gray-600">Address</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {shop.address || shop.shop_address || "Not provided"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-600">City</p>
                        <p className="text-lg font-semibold text-gray-900">{shop.city || "Not provided"}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-600">State</p>
                        <p className="text-lg font-semibold text-gray-900">{shop.state || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Phone className="h-6 w-6 text-green-500" />
                    Contact
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <p className="text-sm font-medium text-gray-600">Phone</p>
                      <p className="text-lg font-semibold text-gray-900">{shop.phone || "Not provided"}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                      <p className="text-sm font-medium text-gray-600">Email</p>
                      <p className="text-lg font-semibold text-gray-900">{shop.email || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {shop.visitImages?.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold text-gray-900">Visit Images</CardTitle>
                    {getPreviousImages().length > 0 && (
                      <Button
                        onClick={() => setShowPreviousImages(!showPreviousImages)}
                        variant="outline"
                        className="rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        {showPreviousImages ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Hide Previous
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Show Previous ({getPreviousImages().length})
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-8">
                  {/* Latest Upload Section */}
                  {getLatestImages().length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
                        <h3 className="text-xl font-bold text-gray-900">Latest Upload</h3>
                        <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 font-semibold">
                          New
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {getLatestImages().map((img: any) => (
                          <div key={img._id} className="space-y-4">
                            {img.shopImage && (
                              <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                                <div className="relative">
                                 <Image
                                    src={`${API_BASE_URL}${img.shopImage}`}
                                    alt="Shop"
                                    width={600}
                                    height={400}
                                    className="w-full h-64 object-cover rounded-xl shadow-lg"
                                    priority={true} // for latest images
                                  />
                                  <div className="absolute top-3 left-3">
                                    <Badge className="bg-blue-500 text-white font-semibold shadow-lg">Shop</Badge>
                                  </div>
                                </div>
                              </div>
                            )}

                            {img.shelfImage && (
                              <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-teal-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                                <div className="relative">
                                  <img
                                    src={`${API_BASE_URL}${img.shelfImage}`}
                                    alt="Shelf"
                                    className="w-full h-64 object-cover rounded-xl shadow-lg border-2 border-green-200 hover:scale-105 transition-all duration-300"
                                    onError={(e) => {
                                      e.currentTarget.src = "/placeholder.svg?height=256&width=400&text=Shelf+Image"
                                    }}
                                  />
                                  <div className="absolute top-3 left-3">
                                    <Badge className="bg-green-500 text-white font-semibold shadow-lg">Shelf</Badge>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Previous Images Section */}
                  {showPreviousImages && getPreviousImages().length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 pt-6 border-t border-gray-200">
                        <div className="w-3 h-3 bg-gradient-to-r from-gray-400 to-slate-500 rounded-full"></div>
                        <h3 className="text-xl font-bold text-gray-900">Previous Uploads</h3>
                        <Badge className="bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200 font-semibold">
                          Archive ({getPreviousImages().length})
                        </Badge>
                      </div>

                      <div className="space-y-6">
                        {getPreviousImages().map((img: any, index: number) => (
                          <div
                            key={img._id}
                            className="bg-gradient-to-r from-gray-50/80 to-slate-50/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                {getPreviousImages().length - index}
                              </div>
                              <h4 className="text-lg font-semibold text-gray-800">
                                Visit #{getPreviousImages().length - index}
                              </h4>
                              <div className="text-sm text-gray-500 bg-white/60 px-3 py-1 rounded-full">
                                {img.createdAt ? new Date(img.createdAt).toLocaleDateString() : "Previous Upload"}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {img.shopImage && (
                                <div className="relative group">
                                  <img
                                    src={`${API_BASE_URL}${img.shopImage}`}
                                    alt="Shop"
                                    className="w-full h-48 object-cover rounded-xl shadow-md border border-gray-200 hover:scale-105 transition-all duration-300"
                                    onError={(e) => {
                                      e.currentTarget.src = "/placeholder.svg?height=192&width=300&text=Shop+Image"
                                    }}
                                  />
                                  <div className="absolute top-2 left-2">
                                    <Badge className="bg-blue-500/90 text-white font-medium text-xs shadow-md">
                                      Shop
                                    </Badge>
                                  </div>
                                </div>
                              )}

                              {img.shelfImage && (
                                <div className="relative group">
                                  <img
                                    src={`${API_BASE_URL}${img.shelfImage}`}
                                    alt="Shelf"
                                    className="w-full h-48 object-cover rounded-xl shadow-md border border-gray-200 hover:scale-105 transition-all duration-300"
                                    onError={(e) => {
                                      e.currentTarget.src = "/placeholder.svg?height=192&width=300&text=Shelf+Image"
                                    }}
                                  />
                                  <div className="absolute top-2 left-2">
                                    <Badge className="bg-green-500/90 text-white font-medium text-xs shadow-md">
                                      Shelf
                                    </Badge>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Full Data Table */}
           <CardContent className="p-0">
  <div className="overflow-x-auto">
    <table className="w-full border border-gray-300 border-collapse">
      <thead>
        <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <th className="border px-6 py-4 text-left font-bold text-gray-700">Field</th>
          <th className="border px-6 py-4 text-left font-bold text-gray-700">Value</th>
          <th className="border px-6 py-4 text-left font-bold text-gray-700">Field</th>
          <th className="border px-6 py-4 text-left font-bold text-gray-700">Value</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: Math.ceil(Object.entries(shop).length / 2) }).map((_, i) => {
          const first = Object.entries(shop)[i * 2]
          const second = Object.entries(shop)[i * 2 + 1]

          return (
            <tr
              key={`${first?.[0] || "empty"}-${second?.[0] || "empty"}`}
              className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50 transition-all duration-200"
            >
              {/* First field */}
              <td className="border px-6 py-4 font-semibold text-gray-600">{formatFieldName(first[0])}</td>
              <td className="border px-6 py-4 text-gray-900">
                {first[0].toLowerCase().includes("status") ? (
                  <Badge className={`${getStatusColor(String(first[1]))} font-bold`}>
                    {String(first[1]).toUpperCase()}
                  </Badge>
                ) : (
                  formatFieldValue(first[1])
                )}
              </td>

              {/* Second field if exists */}
              {second ? (
                <>
                  <td className="border px-6 py-4 font-semibold text-gray-600">
                    {formatFieldName(second[0])}
                  </td>
                  <td className="border px-6 py-4 text-gray-900">
                    {second[0].toLowerCase().includes("status") ? (
                      <Badge className={`${getStatusColor(String(second[1]))} font-bold`}>
                        {String(second[1]).toUpperCase()}
                      </Badge>
                    ) : (
                      formatFieldValue(second[1])
                    )}
                  </td>
                </>
              ) : (
                <>
                  <td className="border px-6 py-4"></td>
                  <td className="border px-6 py-4"></td>
                </>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
</CardContent>

          </div>
        )}
      </div>
    </div>
  )
}
