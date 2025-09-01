"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchShopById } from "@/lib/api"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, MapPin, Phone, Star, ImageIcon, History } from "lucide-react"
import MapDynamic from "@/components/MapDynamic"
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
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)

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
      <div className="relative cursor-zoom-in" onClick={() => setEnlargedImage(fullImageSrc)}>
        <img
          src={fullImageSrc || "/placeholder.svg"}
          alt={altText}
          className="w-full h-64 object-cover rounded-xl shadow-lg border-2 border-gray-200 hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=256&width=400&text=Image+Not+Available"
          }}
        />
        {/* Only show badge if not enlarged */}
        {!enlargedImage && (
          <div className={`absolute top-2 left-2 ${badgeColor} text-white px-3 py-1 rounded-lg text-sm font-semibold`}>
            {badgeText}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Image Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md"
          onClick={() => setEnlargedImage(null)}
        >
          <div
            className="relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 bg-white/80 rounded-full p-2 shadow-lg transition hover:bg-pink-200 hover:scale-110"
              onClick={() => setEnlargedImage(null)}
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={enlargedImage}
              alt="Enlarged"
              className="w-[80vw] max-w-4xl max-h-[80vh] rounded-2xl shadow-2xl border-4 border-white"
            />
          </div>
        </div>
      )}
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
                <span className="w-2 h-2 bg-green-500 rounded-full"></span> Latest Upload
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
                              <div key={`${img._id || Math.random()}-shop`} className="relative group cursor-zoom-in" onClick={() => setEnlargedImage(img.shopImage.startsWith("http") ? img.shopImage : `${API_BASE_URL || ""}${img.shopImage}`)}>
                                <img
                                  src={
                                    img.shopImage.startsWith("http")
                                      ? img.shopImage
                                      : `${API_BASE_URL || ""}${img.shopImage}`
                                  }
                                  alt="Shop"
                                  className="w-full h-48 object-cover rounded-lg shadow-md border-2 border-blue-200 group-hover:scale-105 group-hover:shadow-xl transition-all duration-300"
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement
                                    target.src = "/placeholder.svg?height=192&width=300&text=Shop"
                                  }}
                                />
                                <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-semibold shadow-lg">
                                  Shop View
                                </div>
                              </div>
                            )}

                            {img.shelfImage && (
                              <div key={`${img._id || Math.random()}-shelf`} className="relative group cursor-zoom-in" onClick={() => setEnlargedImage(img.shelfImage.startsWith("http") ? img.shelfImage : `${API_BASE_URL || ""}${img.shelfImage}`)}>
                                <img
                                  src={
                                    img.shelfImage.startsWith("http")
                                      ? img.shelfImage
                                      : `${API_BASE_URL || ""}${img.shelfImage}`
                                  }
                                  alt="Shelf"
                                  className="w-full h-48 object-cover rounded-lg shadow-md border-2 border-green-200 group-hover:scale-105 group-hover:shadow-xl transition-all duration-300"
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement
                                    target.src = "/placeholder.svg?height=192&width=300&text=Shelf"
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
        {Array.from({ length: Math.ceil(Object.entries(shop).length / 2) }).map((_, i) => {
          const first = Object.entries(shop)[i * 2]
          const second = Object.entries(shop)[i * 2 + 1]

          // use actual field names in key so it’s unique + stable
          const rowKey = `${first?.[0] || "empty"}-${second?.[0] || "empty"}`

          return (
            <tr
              key={rowKey}
              className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50 transition-all duration-200"
            >
              {/* First column */}
              <td className="border px-6 py-4 font-semibold text-gray-600">
                {formatFieldName(first[0])}
              </td>
              <td className="border px-6 py-4 text-gray-900">
                {first[0].toLowerCase().includes("status") ? (
                  <Badge className={`${getStatusColor(String(first[1]))} font-bold`}>
                    {String(first[1]).toUpperCase()}
                  </Badge>
                ) : (
                  formatFieldValue(first[1])
                )}
              </td>

              {/* Second column (if exists) */}
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
            {/* Map Section */}
            <div className="mt-10">
              {/* Prepare markers for shop and visitImages locations */}
              {(() => {
                // Shop main location
                const shopLat = shop?.coordinates?.lat || shop?.gps_n || shop?.lat || 30.67
                const shopLng = shop?.coordinates?.lng || shop?.gps_e || shop?.lng || 69.36

                // VisitImages locations (startAudit, photoClick, proceedClick)
                type Marker = {
                  lat: number
                  lng: number
                  label?: string
                  color?: string
                }
                let visitMarkers: Marker[] = []
                if (Array.isArray(shop?.visitImages)) {
                  shop.visitImages.forEach((img, idx) => {
                    // Use visitLocation if present
                    if (img?.visitLocation?.startAudit?.latitude && img?.visitLocation?.startAudit?.longitude) {
                      visitMarkers.push({
                        lat: img.visitLocation.startAudit.latitude,
                        lng: img.visitLocation.startAudit.longitude,
                        label: `Visit Start #${idx + 1}`,
                        color: '#22c55e' // green
                      })
                    }
                    if (img?.visitLocation?.photoClick?.latitude && img?.visitLocation?.photoClick?.longitude) {
                      visitMarkers.push({
                        lat: img.visitLocation.photoClick.latitude,
                        lng: img.visitLocation.photoClick.longitude,
                        label: `Photo Click #${idx + 1}`,
                        color: '#3b82f6' // blue
                      })
                    }
                    if (img?.visitLocation?.proceedClick?.latitude && img?.visitLocation?.proceedClick?.longitude) {
                      visitMarkers.push({
                        lat: img.visitLocation.proceedClick.latitude,
                        lng: img.visitLocation.proceedClick.longitude,
                        label: `Proceed Click #${idx + 1}`,
                        color: '#f59e42' // orange
                      })
                    }
                  })
                }

                // Always show shop location as main marker
                const allMarkers: Marker[] = [
                  {
                    lat: shopLat,
                    lng: shopLng,
                    label: 'Shop Location',
                    color: '#6366f1' // indigo
                  },
                  ...visitMarkers
                ]

                // Legend click handler
                const [selectedPinIdx, setSelectedPinIdx] = useState<number | null>(null)

                // MapDynamic will accept selectedPinIdx and a callback to update it
                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-indigo-600" /> Shop Location
                      </h2>
                      {/* Pin color legend slightly left of previous position, clickable */}
                      <div className="flex flex-wrap gap-4 items-center mr-6">
                        <span
                          className="flex items-center gap-2 cursor-pointer select-none group"
                          onClick={() => setSelectedPinIdx(0)}
                          tabIndex={0}
                          role="button"
                          aria-label="Shop Location"
                        >
                          <span
                            className="transition-all duration-200"
                            style={{
                              background: '#6366f1',
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              display: 'inline-block',
                              border: '2px solid #fff',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                            }}
                          ></span>
                          <span className="text-sm text-gray-700">Shop Location</span>
                          <style jsx>{`
                            .group:hover span:first-child {
                              transform: scale(1.15);
                              border: 3px solid #22c55e;
                              box-shadow: 0 4px 12px rgba(34,197,94,0.15);
                            }
                          `}</style>
                        </span>
                        {visitMarkers.map((m, idx) => (
                          <span
                            key={idx}
                            className="flex items-center gap-2 cursor-pointer select-none group"
                            onClick={() => setSelectedPinIdx(idx + 1)}
                            tabIndex={0}
                            role="button"
                            aria-label={m.label}
                          >
                            <span
                              className="transition-all duration-200"
                              style={{
                                background: m.color,
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                display: 'inline-block',
                                border: '2px solid #fff',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                              }}
                            ></span>
                            <span className="text-sm text-gray-700">{m.label}</span>
                            <style jsx>{`
                              .group:hover span:first-child {
                                transform: scale(1.15);
                                border: 3px solid #22c55e;
                                box-shadow: 0 4px 12px rgba(34,197,94,0.15);
                              }
                            `}</style>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="w-full h-[400px] rounded-xl overflow-hidden border border-indigo-200 shadow-lg">
                      {/* @ts-ignore: MapDynamic forwards props to Map, which accepts markers and selectedPinIdx */}
                      <MapDynamic markers={allMarkers} selectedPinIdx={selectedPinIdx} />
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}
