"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

import { AlertTriangle, RefreshCw, Eye, MapPin, Phone, Calendar, Star, ArrowLeft, Brain, CheckCircle, XCircle, Navigation, MapPin as MapPinIcon } from "lucide-react"
import { fetchShops, fetchVisitedShops, fetchAllUsers, fetchShopById, fetchAIDetectionResults, type Shop, type User, type AIDetectionResponse } from "@/lib/api"

interface MappedShop {
  id: string
  name: string
  address: string
  city: string
  phone: string
  validationScore?: number
  visitImages?: any[]
  lastVisit?: string
  assignedManagerId?: string
  aiDetectionSummary?: {
    totalLaysDetected: number
    averageConfidence: number
    lastDetection: string | null
    detectionMethods: string[]
  }
  gpsValidationSummary?: {
    validVisits: number
    invalidVisits: number
    partialVisits: number
    noDataVisits: number
    averageDistance: number
    validationRate: number
  }
  [key: string]: any
}

type ViewMode = 'all' | 'visited' | 'unvisited' | 'detail'

export default function ReportsPage() {
  const [shops, setShops] = useState<MappedShop[]>([])
  const [visitedShops, setVisitedShops] = useState<MappedShop[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('visited')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([])
  const [selectedShopDetail, setSelectedShopDetail] = useState<any>(null)
  const [loadingShopDetail, setLoadingShopDetail] = useState(false)
  const [aiDetectionData, setAiDetectionData] = useState<Map<string, AIDetectionResponse>>(new Map())
  const [loadingAI, setLoadingAI] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  function mapShop(s: any): MappedShop {
    return {
      ...s,
      id: s._id || s.id,
      name: s.shop_name ?? s.name ?? "",
      address: s.shop_address ?? s.address ?? "",
      city: s.city_village ?? s.city ?? "",
      phone: s.mobile ?? s.phone ?? "",
      validationScore: s.validationScore,
      visitImages: s.visitImages,
      lastVisit: s.visitedAt ?? s.lastVisit,
      assignedManagerId: s.assignedManagerId,
      aiDetectionSummary: s.aiDetectionSummary
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
        setShops(prev => prev.map(shop => 
          shop.id === shopId 
            ? { ...shop, aiDetectionSummary: result.summary }
            : shop
        ))
        setVisitedShops(prev => prev.map(shop => 
          shop.id === shopId 
            ? { ...shop, aiDetectionSummary: result.summary }
            : shop
        ))
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

  async function loadData() {
    setLoading(true)
    try {
      const [shopsRes, visitedRes, usersRes] = await Promise.all([
        fetchShops(),
        fetchVisitedShops(),
        fetchAllUsers()
      ])

      // For your main and visited shops, always use mapped objects!
      const mappedShops = (shopsRes.shops || shopsRes || []).map(mapShop)
      setShops(mappedShops)

      const mappedVisitedShops = (visitedRes.shops || visitedRes || []).map(mapShop)
      setVisitedShops(mappedVisitedShops)

      setUsers(usersRes.users || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewShopDetail = async (shopId: string) => {
    setLoadingShopDetail(true)
    try {
      const [shopResult, aiResult] = await Promise.all([
        fetchShopById(shopId),
        fetchAIDetectionResults(shopId)
      ])
      
      if (shopResult.success) {
        setSelectedShopDetail({
          ...shopResult.data,
          aiDetection: aiResult.success ? aiResult : null
        })
        setViewMode('detail')
      } else {
        console.error('Failed to fetch shop details:', shopResult.error)
        alert('Failed to load shop details: ' + shopResult.error)
      }
    } catch (error) {
      console.error('Error fetching shop details:', error)
      alert('Error loading shop details')
    } finally {
      setLoadingShopDetail(false)
    }
  }

  const refreshReports = async () => {
    await loadData()
  }

  const totalShops = shops.length
  const visitedCount = visitedShops.length
  const pendingCount = totalShops - visitedCount
  const topAuditor = users.length > 0 ? users[0].name : "N/A"
  const reportsGenerated = visitedCount
  const avgValidationScore = shops.length > 0
    ? Math.round(
        shops.reduce((sum, shop) => sum + (shop.validationScore || 0), 0) / shops.length
      )
    : 0

  // Unvisited shops: id logic is always safe now
  const visitedShopIds = new Set(visitedShops.map(shop => shop.id))
  const unvisitedShops = shops.filter(shop => !visitedShopIds.has(shop.id))

  const getCurrentShops = () => {
    switch (viewMode) {
      case 'visited':
        return visitedShops
      case 'unvisited':
        return unvisitedShops
      case 'all':
      default:
        return shops
    }
  }

  // Only block if assignedManagerId is set and non-empty
  const isVisited = (s: MappedShop): boolean =>
    Array.isArray(s.visitImages) && (s.visitImages.length || 0) > 0
  const isAssignedToManager = (s: MappedShop): boolean =>
    !!(s.assignedManagerId && String(s.assignedManagerId).trim() !== "");

  const renderShopDetailTable = () => {
    if (!selectedShopDetail) return null

    const renderValue = (value: any): string => {
      if (value === null || value === undefined) return 'N/A'
      if (typeof value === 'boolean') return value ? 'Yes' : 'No'
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          return value.length > 0 ? `${value.length} items` : 'None'
        }
        return JSON.stringify(value, null, 2)
      }
      if (typeof value === 'string' && value.includes('T') && value.includes(':')) {
        try {
          return new Date(value).toLocaleString()
        } catch {
          return value
        }
      }
      return String(value)
    }

    const getAllProperties = (obj: any, prefix = ''): Array<{ key: string, value: any }> => {
      const properties: Array<{ key: string, value: any }> = []

      Object.keys(obj).forEach(key => {
        const value = obj[key]
        const fullKey = prefix ? `${prefix}.${key}` : key

        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          properties.push(...getAllProperties(value, fullKey))
        } else {
          properties.push({ key: fullKey, value })
        }
      })

      return properties
    }

    const allProperties = getAllProperties(selectedShopDetail)

    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-white rounded-t-lg border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl text-black">
              <Eye className="h-5 w-5 text-indigo-600" />
              Shop Details: {selectedShopDetail.name || 'Unknown Shop'}
            </CardTitle>
            <Button
              onClick={() => setViewMode('all')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Reports
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border border-slate-300 border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-700 w-1/3 border border-slate-300">Property</th>
                  <th className="text-left p-4 font-semibold text-slate-700 w-2/3 border border-slate-300">Value</th>
                </tr>
              </thead>
              <tbody>
                {allProperties.map((property, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-700 capitalize border border-slate-300">
                      {property.key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\./g, ' → ')}
                    </td>
                    <td className="p-4 text-slate-600 border border-slate-300">
                      <div className="max-w-md break-words">
                        {typeof property.value === 'object' && property.value !== null ? (
                          <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-32 border border-slate-200">
                            {JSON.stringify(property.value, null, 2)}
                          </pre>
                        ) : (
                          renderValue(property.value)
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            <span className="ml-3 text-gray-700">Loading reports...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
      <div className="w-full p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-3 bg-black rounded-xl shadow-lg">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-4xl font-bold text-slate-900">Reports</h1>
              <p className="text-slate-600 mt-1">View and analyze shop validation reports</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={refreshReports}
              variant="outline"
              className="flex items-center gap-2 border-gray-300 text-gray-800 hover:bg-gray-100 w-full sm:w-auto"
              disabled={loading || loadingDetails}
            >
              <RefreshCw className={`h-4 w-4 ${(loading || loadingDetails) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        {viewMode === 'detail' && selectedShopDetail && (
          <div>
            {renderShopDetailTable()}
          </div>
        )}
        {viewMode !== 'detail' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">Total Shops</p>
                      <p className="text-3xl font-bold text-gray-900">{totalShops}</p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-gray-800" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">Visited Shops</p>
                      <p className="text-3xl font-bold text-gray-900">{visitedCount}</p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Eye className="h-6 w-6 text-gray-800" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">Unvisited Shops</p>
                      <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <RefreshCw className="h-6 w-6 text-gray-800" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">AI Detection</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {visitedShops.filter(shop => shop.aiDetectionSummary?.totalLaysDetected > 0).length}
                      </p>
                      <p className="text-xs text-slate-500">Shops with Lay's detected</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Brain className="h-6 w-6 text-blue-800" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">GPS Validation</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {visitedShops.filter(shop => shop.gpsValidationSummary?.validVisits > 0).length}
                      </p>
                      <p className="text-xs text-slate-500">Shops with valid GPS</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Navigation className="h-6 w-6 text-green-800" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
              <Button
                onClick={() => setViewMode('all')}
                variant={viewMode === 'all' ? 'default' : 'outline'}
                className={viewMode === 'all' ? 'bg-black hover:bg-gray-900 text-white' : 'border-gray-300 text-gray-800 hover:bg-gray-100'}
              >
                All Shops ({totalShops})
              </Button>
              <Button
                onClick={() => setViewMode('visited')}
                variant={viewMode === 'visited' ? 'default' : 'outline'}
                className={viewMode === 'visited' ? 'bg-black hover:bg-gray-900 text-white' : 'border-gray-300 text-gray-800 hover:bg-gray-100'}
              >
                Visited Shops ({visitedCount})
              </Button>
              <Button
                onClick={() => setViewMode('unvisited')}
                variant={viewMode === 'unvisited' ? 'default' : 'outline'}
                className={viewMode === 'unvisited' ? 'bg-black hover:bg-gray-900 text-white' : 'border-gray-300 text-gray-800 hover:bg-gray-100'}
              >
                Unvisited Shops ({pendingCount})
              </Button>
            </div>
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-white rounded-t-lg border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl text-black">
                    <AlertTriangle className="h-5 w-5 text-gray-800" />
                    {viewMode === 'visited' ? 'Visited Shops Report' : 
                     viewMode === 'unvisited' ? 'Unvisited Shops Report' : 
                     'All Shops Report'}
                    {loadingDetails && (
                      <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
                    )}
                  </CardTitle>
                  {viewMode === 'visited' && (
                    <div className="flex items-center gap-2">
                      {!selectMode ? (
                        <Button
                          onClick={() => {
                            setSelectMode(true)
                            const autoSelected = getCurrentShops()
                              .filter((shop: MappedShop) => isVisited(shop) && !isAssignedToManager(shop))
                              .map((shop: MappedShop) => shop.id)
                            setSelectedShopIds(autoSelected)
                          }}
                          className="bg-black hover:bg-gray-900 text-white"
                        >
                          Select Shops
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectMode(false)
                              setSelectedShopIds([])
                            }}
                            className="border-gray-300 text-gray-800 hover:bg-gray-100"
                          >
                            Cancel Selection
                          </Button>
                          <Button
                            variant="outline"
                            className="border-gray-300 text-gray-800 hover:bg-gray-100"
                            onClick={() => setSelectedShopIds(
                              getCurrentShops()
                                .filter((shop: MappedShop) => isVisited(shop) && !isAssignedToManager(shop))
                                .map((shop: MappedShop) => shop.id)
                            )}
                          >
                            Select All Shops
                          </Button>
                          <Button
                            variant="outline"
                            className="border-gray-300 text-gray-800 hover:bg-gray-100"
                            onClick={() => setSelectedShopIds([])}
                          >
                            Deselect All Shops
                          </Button>
                          <Button
                            className="bg-black hover:bg-gray-900 text-white"
                            onClick={() => {
                              const ids = selectedShopIds.join(',')
                              if (!ids) return
                              window.location.href = `/dashboard/managers/assign?shopIds=${encodeURIComponent(ids)}`
                            }}
                            disabled={selectedShopIds.length === 0}
                          >
                            Assign Shops
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {getCurrentShops().length === 0 ? (
                  <div className="p-8 text-center text-slate-600">
                    <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-2">
                      No {viewMode === 'visited' ? 'Visited' : viewMode === 'unvisited' ? 'Unvisited' : ''} Shops
                    </p>
                    <p>No shops found for the selected filter.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          {selectMode && viewMode === 'visited' && (
                            <th className="w-10 p-4 text-slate-700">
                            </th>
                          )}
                          <th className="text-left p-4 font-semibold text-slate-700">Shop Name</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Address</th>
                          <th className="text-left p-4 font-semibold text-slate-700">City</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Phone</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Validation Score</th>
                          <th className="text-left p-4 font-semibold text-slate-700">AI Detection</th>
                          <th className="text-left p-4 font-semibold text-slate-700">GPS Validation</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Visits</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Last Visit</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getCurrentShops().map((shop, index) => {
                          const isSelected = selectedShopIds.includes(shop.id)
                          const assigned = isAssignedToManager(shop)
                          return (
                          <tr
                            key={shop.id || index}
                            className={`border-b transition-colors ${selectMode ? (assigned ? 'cursor-not-allowed' : 'cursor-pointer') : ''} ${isSelected ? 'bg-blue-50' : assigned ? 'bg-amber-50/60' : 'hover:bg-slate-50'}`}
                            onClick={() => {
                              if (!selectMode) return
                              if (assigned) return
                              const id = shop.id
                              setSelectedShopIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
                            }}
                          >
                            {selectMode && viewMode === 'visited' && (
                              <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (assigned) return
                                    const id = shop.id
                                    setSelectedShopIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
                                  }}
                                  disabled={assigned}
                                />
                              </td>
                            )}
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-slate-900">
                                  {shop.name || 'N/A'}
                                </div>
                                {assigned && (
                                  <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 border border-amber-200">
                                    Assigned to Manager
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-600 text-sm">
                                  {shop.address || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-slate-600">
                                {shop.city || 'N/A'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span className="text-slate-600 text-sm">
                                  {shop.phone || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-gray-500" />
                                <span className="font-semibold text-gray-800">
                                  {shop.validationScore !== undefined ? `${shop.validationScore.toFixed(1)}%` : 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {loadingAI.has(shop.id) ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                ) : shop.aiDetectionSummary ? (
                                  <div className="flex items-center gap-1">
                                    {shop.aiDetectionSummary.totalLaysDetected > 0 ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    )}
                                    <span className="text-sm font-medium">
                                      {shop.aiDetectionSummary.totalLaysDetected} Lay's
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      ({Math.round(shop.aiDetectionSummary.averageConfidence * 100)}%)
                                    </span>
                                  </div>
                                ) : shop.visitImages?.length > 0 ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      loadAIDetectionData(shop.id)
                                    }}
                                    className="text-xs px-2 py-1 h-6"
                                  >
                                    <Brain className="h-3 w-3 mr-1" />
                                    Load AI
                                  </Button>
                                ) : (
                                  <span className="text-xs text-gray-400">No visits</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {shop.gpsValidationSummary ? (
                                  <div className="flex items-center gap-1">
                                    {shop.gpsValidationSummary.validVisits > 0 ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : shop.gpsValidationSummary.invalidVisits > 0 ? (
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    ) : (
                                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                    )}
                                    <span className="text-sm font-medium">
                                      {shop.gpsValidationSummary.validVisits} Valid
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      ({Math.round(shop.gpsValidationSummary.validationRate)}%)
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">No GPS data</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                                {shop.visitImages?.length || 0} visits
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-slate-600 text-sm">
                                  {shop.lastVisit ? new Date(shop.lastVisit).toLocaleDateString() : 'Never'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (selectMode) return
                                    router.push(`/dashboard/shops/${shop.id}`)
                                  }}
                                  className={`w-full sm:w-auto bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-900 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 ${selectMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  disabled={selectMode}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Shop Details
                                </Button>
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
        {viewMode !== 'detail' && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-white rounded-t-lg border-b">
                <CardTitle className="text-lg text-slate-800">Auditor Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Top Auditor:</span>
                    <span className="font-bold text-gray-900">{topAuditor}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Average Score:</span>
                    <span className="font-bold text-gray-900">{avgValidationScore}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Reports Generated:</span>
                    <span className="font-bold text-gray-900">{reportsGenerated}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-white rounded-t-lg border-b">
                <CardTitle className="text-lg text-slate-800">Validation Progress</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Completion Rate:</span>
                    <span className="font-bold text-gray-900">
                      {totalShops > 0 ? Math.round((visitedCount / totalShops) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: totalShops > 0 ? `${(visitedCount / totalShops) * 100}%` : '0%' 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{visitedCount} completed</span>
                    <span>{pendingCount} pending</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}