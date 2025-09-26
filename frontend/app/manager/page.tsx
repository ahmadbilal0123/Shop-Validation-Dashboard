"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Store, RefreshCw, Eye, MapPin, Calendar, Brain, CheckCircle, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth" // ✅ assumes you have a useAuth hook
import { useEffect, useState } from "react"
import { getSession } from "@/lib/auth"
import { fetchAssignedShopsForAuditor, fetchAIDetectionResults, type AssignedShopsResponse, type AIDetectionResponse } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { ManagerSidebar } from "@/components/manager-sidebar"

// ✅ Define the Shop type
interface ShopApiItem {
  id?: string
  _id?: string
  name?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  createdAt?: string
  lastVisit?: string
  visitImages?: Array<any>
  aiDetectionSummary?: {
    totalLaysDetected: number
    averageConfidence: number
    lastDetection: string | null
    detectionMethods: string[]
  }
}

export default function ManagerDashboard() {
  const router = useRouter()
  const { user, logout } = useAuth() // ✅ get user + logout function from auth

  const [shops, setShops] = useState<ShopApiItem[]>([])
  const [allShops, setAllShops] = useState<ShopApiItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showVisitedOnly, setShowVisitedOnly] = useState<boolean>(false)
  const [selectMode, setSelectMode] = useState<boolean>(false)
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([])
  const [aiDetectionData, setAiDetectionData] = useState<Map<string, AIDetectionResponse>>(new Map())
  const [loadingAI, setLoadingAI] = useState<Set<string>>(new Set())

  const totalShops: number = shops.length
  const selectedShops: number = 0 // This will be managed by state

  const loadShops = async () => {
    setLoading(true)
    try {
      const currentUserId = user?.id || getSession()?.user?.id
      if (!currentUserId) throw new Error("No user id found for assigned shops fetch")

      const res: AssignedShopsResponse = await fetchAssignedShopsForAuditor(currentUserId)
      if (res.success) {
        const list: ShopApiItem[] = res.shops as any
        setAllShops(Array.isArray(list) ? list : [])
        setShops(Array.isArray(list) ? list : [])
      } else {
        setAllShops([])
        setShops([])
      }
    } catch (e) {
      setAllShops([])
      setShops([])
    } finally {
      setLoading(false)
    }
  }

  // Function to load AI detection data for a shop
  const loadAIDetectionData = async (shopId: string) => {
    if (aiDetectionData.has(shopId) || loadingAI.has(shopId)) return
    
    setLoadingAI(prev => new Set(prev).add(shopId))
    try {
      const result = await fetchAIDetectionResults(shopId)
      if (result.success) {
        setAiDetectionData(prev => new Map(prev).set(shopId, result))
        
        // Update the shop data with AI detection summary
        setShops(prev => prev.map(shop => {
          const shopIdCheck = shop._id || shop.id
          return shopIdCheck === shopId 
            ? { ...shop, aiDetectionSummary: result.summary }
            : shop
        }))
        setAllShops(prev => prev.map(shop => {
          const shopIdCheck = shop._id || shop.id
          return shopIdCheck === shopId 
            ? { ...shop, aiDetectionSummary: result.summary }
            : shop
        }))
      }
    } catch (error) {
      console.error('Error loading AI detection data:', error)
    } finally {
      setLoadingAI(prev => {
        const newSet = new Set(prev)
        newSet.delete(shopId)
        return newSet
      })
    }
  }

  useEffect(() => {
    loadShops()
  }, [])

  const filterShopsBySearch = (items: ShopApiItem[], query: string) => {
    if (!query.trim()) return items
    const q = query.toLowerCase().trim()
    return items.filter((shop) => {
      const name = ((shop as any).shop_name || (shop as any).name || (shop as any).shopName)
        ?.toLowerCase?.() || ""
      const address = ((shop as any).shop_address || (shop as any).address)
        ?.toLowerCase?.() || ""
      const city = ((shop as any).shop_city || (shop as any).city)
        ?.toLowerCase?.() || ""
      const state = ((shop as any).shop_state || (shop as any).state)
        ?.toLowerCase?.() || ""
      const location = (shop as any).location?.toLowerCase?.() || ""
      return name.includes(q) || address.includes(q) || city.includes(q) || state.includes(q) || location.includes(q)
    })
  }

  useEffect(() => {
    const visited = allShops.filter((s) => Array.isArray(s.visitImages) && s.visitImages!.length > 0)
    const base = showVisitedOnly ? visited : allShops
    setShops(filterShopsBySearch(base, searchQuery))
  }, [allShops, showVisitedOnly, searchQuery])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Manager Dashboard
              </h1>
              {/* <p className="text-gray-600">
                Efficiently manage and assign shops to auditors or all the users
              </p> */}
            </div>
            <div className="flex items-center gap-4">
              <Badge
                variant="secondary"
                className="bg-gray-200 text-gray-800 px-4 py-2"
              >
                <Store className="w-4 h-4 mr-2" />
                {shops.length} Shops
              </Badge>

              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 px-4 py-2"
              >
                <Brain className="w-4 h-4 mr-2" />
                {shops.filter(shop => shop.aiDetectionSummary?.totalLaysDetected > 0).length} Lay's Handlers
              </Badge>

              <Button variant="outline" size="sm" className="border-gray-300 text-gray-800 hover:bg-gray-100" onClick={loadShops} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 sm:p-6 pt-4 sticky top-0 z-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-lg p-4 sm:p-6 mb-4">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
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
                  className={!showVisitedOnly ? "bg-black hover:bg-black text-white" : "border-blue-300 text-blue-700 hover:bg-blue-50"}
                  onClick={() => setShowVisitedOnly(false)}
                >
                  All Shops
                </Button>
              {shops.length > 0 && (
                selectMode ? (
                  <>
                    <Button
                      variant="outline"
                      className="border-gray-300 text-gray-800 hover:bg-gray-100"
                      onClick={() => setSelectedShopIds(shops.map((s: any) => (s._id || s.id || s.shop_id) as string).filter(Boolean))}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-300 text-gray-800 hover:bg-gray-100"
                      onClick={() => setSelectedShopIds([])}
                    >
                      Deselect All
                    </Button>
                    <Button
                      className="bg-black hover:bg-gray-900 text-white"
                      disabled={selectedShopIds.length === 0}
                      onClick={() => {
                        const ids = selectedShopIds.join(",")
                        if (!ids) return
                        // Navigate to salesperson assignment page (moved out of dashboard)
                        router.push(`/salespersons/assign?shopIds=${encodeURIComponent(ids)}`)
                      }}
                    >
                      Assign Shops
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-300 text-gray-800 hover:bg-gray-100"
                      onClick={() => {
                        setSelectMode(false)
                        setSelectedShopIds([])
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    className="bg-black hover:bg-gray-900 text-white"
                    onClick={() => {
                      setSelectMode(true)
                      setSelectedShopIds([])
                    }}
                  >
                    Select Shops
                  </Button>
                )
              )}
              </div>
              <div className="relative w-full md:w-80">
                <Input
                  placeholder="Search shops..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-3 pr-3 border-blue-200 focus:ring-black w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shop Grid */}
        <div className="flex-1 p-4 sm:p-6">
          {shops.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Store className="w-12 h-12 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No shops found</h3>
              <p className="text-sm">{loading ? "Loading shops..." : "Connect your API to load shop data"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {shops.map((shop) => {
                const sid = ((shop as any)._id || (shop as any).id || (shop as any).shop_id) as string
                const isSelected = selectedShopIds.includes(sid)
                return (
                <Card
                  key={(shop.id || shop._id) as string}
                  onClick={() => {
                    if (!selectMode) return
                    if (!sid) return
                    setSelectedShopIds((prev) => prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid])
                  }}
                  className={`group relative bg-white/90 backdrop-blur-sm border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    selectMode
                      ? isSelected
                        ? "border-gray-400 ring-2 ring-gray-300"
                        : "border-blue-100 hover:border-blue-200"
                      : "border-blue-100 hover:border-blue-200"
                  } ${selectMode ? "cursor-pointer" : ""}`}
                >
                  <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/80 to-slate-50/80">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-800 transition-colors">
                          {(shop as any).shop_name || (shop as any).name || (shop as any).shopName || (shop as any).businessName || (shop as any).storeName || (shop as any).title || ((shop.id || shop._id) as string) || "Unnamed Shop"}
                        </CardTitle>
                      </div>
                      {selectMode && (
                        <div className="pl-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={isSelected}
                            onChange={() => {
                              if (!sid) return
                              setSelectedShopIds((prev) => prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid])
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 p-4 sm:p-6 space-y-4">
                    <div className="space-y-3">
                      {((shop as any).shop_address || shop.address || (shop as any).shop_city || shop.city || (shop as any).shop_state || shop.state || (shop as any).zip_code || shop.zipCode || (shop as any).location) && (
                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-slate-700 space-y-1">
                            {((shop as any).shop_address || shop.address) && <p className="font-semibold">{(shop as any).shop_address || shop.address}</p>}
                            {(((shop as any).shop_city || shop.city) || ((shop as any).shop_state || shop.state)) && (
                              <p className="text-slate-600 uppercase tracking-wide">
                                {((shop as any).shop_city || shop.city) && ((shop as any).shop_state || shop.state)
                                  ? `${(shop as any).shop_city || shop.city}, ${(shop as any).shop_state || shop.state}`
                                  : ((shop as any).shop_city || shop.city || (shop as any).shop_state || shop.state)}
                              </p>
                            )}
                            {(((shop as any).zip_code) || shop.zipCode) && <p className="text-slate-500 uppercase tracking-wide">{(shop as any).zip_code || shop.zipCode}</p>}
                            {!((shop as any).shop_address || shop.address) && !(((shop as any).shop_city || shop.city) || ((shop as any).shop_state || shop.state) || ((shop as any).zip_code || shop.zipCode)) && (shop as any).location && (
                              <p className="text-slate-600">{(shop as any).location}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {shop.createdAt && (
                        <div className="flex items-center text-gray-600">
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

                      {/* AI Detection Section */}
                      <div className="pt-3 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                            <Brain className="h-4 w-4 text-blue-600" />
                            AI Detection
                          </span>
                        </div>
                        
                        {loadingAI.has(sid) ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            Analyzing...
                          </div>
                        ) : shop.aiDetectionSummary ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {shop.aiDetectionSummary.totalLaysDetected > 0 ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span className="text-sm font-medium">
                                  {shop.aiDetectionSummary.totalLaysDetected > 0 ? 'Lay\'s Handler' : 'Not Handler'}
                                </span>
                              </div>
                              <span className="text-sm text-gray-600">
                                {shop.aiDetectionSummary.totalLaysDetected} products
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Confidence:</span>
                              <span className="text-xs font-medium">
                                {Math.round(shop.aiDetectionSummary.averageConfidence * 100)}%
                              </span>
                            </div>
                          </div>
                        ) : shop.visitImages?.length > 0 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              loadAIDetectionData(sid)
                            }}
                            className="text-xs px-2 py-1 h-6 w-full"
                          >
                            <Brain className="h-3 w-3 mr-1" />
                            Load AI Analysis
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">No visits yet</span>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          const sid = (shop as any)._id || (shop as any).id || (shop as any).shop_id
                          if (!sid) return
                          router.push(`/manager/shops/${sid}`)
                        }}
                        className="w-full mt-4 sm:mt-6 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 bg-black hover:bg-gray-900"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Shop Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
