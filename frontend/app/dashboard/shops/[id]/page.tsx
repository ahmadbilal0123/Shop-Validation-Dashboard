"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchShopById } from "@/lib/api"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, MapPin, Phone, Star, UserPlus, ImageIcon, History } from "lucide-react"

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
    return shop.visitImages
  }

  const getActualLatestImages = () => {
    const images = getLatestImages()
    return images.length > 0 ? [images[images.length - 1]] : []
  }

  const getPreviousImages = () => {
    const images = getLatestImages()
    return images.length > 1 ? images.slice(0, -1).reverse() : []
  }

  const renderImage = (imageSrc: string, altText: string, badgeText: string, badgeColor: string) => {
    const fullImageSrc = imageSrc.startsWith("http") ? imageSrc : `${API_BASE_URL || ""}${imageSrc}`

    return (
      <div className="relative">
        <img
          src={fullImageSrc || "/placeholder.svg"}
          alt={altText}
          className="w-full h-64 object-cover rounded-xl shadow-lg border-2 border-gray-200 hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=256&width=400&text=Image+Not+Available"
          }}
        />
        <div className={`absolute top-2 left-2 ${badgeColor} text-white px-3 py-1 rounded-lg text-sm font-semibold`}>
          {badgeText}
        </div>
      </div>
    )
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
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
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
              <Card className="bg-white/80 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ImageIcon className="h-6 w-6 text-indigo-500" />
                    Visit Images
                  </h3>

                  {getLatestImages().length > 1 && (
                    <Button
                      onClick={() => setShowPreviousImages(!showPreviousImages)}
                      variant={showPreviousImages ? "default" : "outline"}
                      className="rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <History className="w-4 h-4 mr-2" />
                      {showPreviousImages ? "Hide Previous" : "Show Previous"}
                    </Button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Latest Images Section */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Latest Upload
                    </h4>
                    {getActualLatestImages().map((img: any) => (
                      <div key={`latest-${img._id}`} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {img.shopImage && renderImage(img.shopImage, "Latest Shop Image", "Shop - New", "bg-blue-500")}
                        {img.shelfImage &&
                          renderImage(img.shelfImage, "Latest Shelf Image", "Shelf - New", "bg-green-500")}
                      </div>
                    ))}
                  </div>

                  {showPreviousImages && getPreviousImages().length > 0 && (
                    <div className="bg-gradient-to-br from-slate-50 via-gray-50 to-indigo-50 rounded-2xl p-8 border border-gray-200 shadow-lg">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                          <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-sm"></div>
                          Previous Uploads Archive
                        </h4>
                        <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600">
                            {getPreviousImages().length} visits
                          </span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {getPreviousImages().map((img: any, index: number) => (
                          <div
                            key={`previous-${img._id}-${index}`}
                            className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                  {getPreviousImages().length - index}
                                </div>
                                <div>
                                  <h5 className="font-semibold text-gray-800">
                                    Visit #{getPreviousImages().length - index}
                                  </h5>
                                  <p className="text-sm text-gray-500">Upload Archive</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {img.shopImage && (
                                  <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                    Shop Image
                                  </div>
                                )}
                                {img.shelfImage && (
                                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                                    Shelf Image
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {img.shopImage && (
                                <div className="relative group">
                                  <img
                                    src={
                                      img.shopImage.startsWith("http")
                                        ? img.shopImage
                                        : `${API_BASE_URL || ""}${img.shopImage}`
                                    }
                                    alt={`Shop Image - Visit ${getPreviousImages().length - index}`}
                                    className="w-full h-48 object-cover rounded-lg shadow-md border-2 border-blue-200 group-hover:scale-105 group-hover:shadow-xl transition-all duration-300"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.src = "/placeholder.svg?height=192&width=300&text=Shop+Image"
                                    }}
                                  />
                                  <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-semibold shadow-lg">
                                    Shop View
                                  </div>
                                </div>
                              )}
                              {img.shelfImage && (
                                <div className="relative group">
                                  <img
                                    src={
                                      img.shelfImage.startsWith("http")
                                        ? img.shelfImage
                                        : `${API_BASE_URL || ""}${img.shelfImage}`
                                    }
                                    alt={`Shelf Image - Visit ${getPreviousImages().length - index}`}
                                    className="w-full h-48 object-cover rounded-lg shadow-md border-2 border-green-200 group-hover:scale-105 group-hover:shadow-xl transition-all duration-300"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.src = "/placeholder.svg?height=192&width=300&text=Shelf+Image"
                                    }}
                                  />
                                  <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-semibold shadow-lg">
                                    Shelf View
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
                    {Array.from({
                      length: Math.ceil(Object.entries(shop).length / 2),
                    }).map((_, i) => {
                      const first = Object.entries(shop)[i * 2]
                      const second = Object.entries(shop)[i * 2 + 1]
                      return (
                        <tr
                          key={i}
                          className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50 transition-all duration-200"
                        >
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
