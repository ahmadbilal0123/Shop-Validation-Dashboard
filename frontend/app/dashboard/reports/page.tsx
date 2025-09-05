"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useParams, useRouter } from "next/navigation"

import { AlertTriangle, RefreshCw, Eye, MapPin, Phone, Calendar, Star, ArrowLeft } from "lucide-react"
import { fetchShops, fetchVisitedShops, fetchAllUsers, fetchShopById, type Shop, type User } from "@/lib/api"

interface DetailedShop extends Shop {
  detailedData?: any
}

type ViewMode = 'all' | 'visited' | 'unvisited' | 'detail'

export default function ReportsPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [visitedShops, setVisitedShops] = useState<DetailedShop[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [selectedShopDetail, setSelectedShopDetail] = useState<any>(null)
  const [loadingShopDetail, setLoadingShopDetail] = useState(false)
const router = useRouter()
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [shopsRes, visitedRes, usersRes] = await Promise.all([
        fetchShops(),
        fetchVisitedShops(),
        fetchAllUsers()
      ])
      
      setShops(shopsRes.shops || [])
      const visitedShopsData = visitedRes.shops || []
      setVisitedShops(visitedShopsData)
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
      const result = await fetchShopById(shopId)
      if (result.success) {
        setSelectedShopDetail(result.data)
        setViewMode('detail')
      } else {
        console.error('Failed to fetch shop details:', result.error)
        alert('Failed to load shop details: ' + result.error)
      }
    } catch (error) {
      console.error('Error fetching shop details:', error)
      alert('Error loading shop details')
    } finally {
      setLoadingShopDetail(false)
    }
  }

  // Refresh function
  const refreshReports = async () => {
    await loadData()
  }

  // Calculate summary
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

  // Get unvisited shops
  const visitedShopIds = new Set(visitedShops.map(shop => shop.id))
  const unvisitedShops = shops.filter(shop => !visitedShopIds.has(shop.id))

  // Get current shops to display
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
        // Likely a date string
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
          // Recursively handle nested objects
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600">Loading reports...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Reports</h1>
              <p className="text-slate-600 mt-1">View and analyze shop validation reports</p>
            </div>
          </div>
          
          {/* Refresh Button */}
          <Button
            onClick={refreshReports}
            variant="outline"
            className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            disabled={loading || loadingDetails}
          >
            <RefreshCw className={`h-4 w-4 ${(loading || loadingDetails) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        {/* Show shop detail view */}
        {viewMode === 'detail' && selectedShopDetail && (
          <div>
            {renderShopDetailTable()}
          </div>
        )}

        {/* Show main reports view */}
        {viewMode !== 'detail' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">Total Shops</p>
                      <p className="text-3xl font-bold text-indigo-700">{totalShops}</p>
                    </div>
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">Visited Shops</p>
                      <p className="text-3xl font-bold text-green-700">{visitedCount}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Eye className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">Unvisited Shops</p>
                      <p className="text-3xl font-bold text-yellow-700">{pendingCount}</p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <RefreshCw className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Button
                onClick={() => setViewMode('all')}
                variant={viewMode === 'all' ? 'default' : 'outline'}
                className={viewMode === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-300 text-blue-700 hover:bg-blue-50'}
              >
                All Shops ({totalShops})
              </Button>
              <Button
                onClick={() => setViewMode('visited')}
                variant={viewMode === 'visited' ? 'default' : 'outline'}
                className={viewMode === 'visited' ? 'bg-green-600 hover:bg-green-700' : 'border-green-300 text-green-700 hover:bg-green-50'}
              >
                Visited Shops ({visitedCount})
              </Button>
              <Button
                onClick={() => setViewMode('unvisited')}
                variant={viewMode === 'unvisited' ? 'default' : 'outline'}
                className={viewMode === 'unvisited' ? 'bg-yellow-600 hover:bg-yellow-700' : 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'}
              >
                Unvisited Shops ({pendingCount})
              </Button>
            </div>

            {/* Shops Table */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-white rounded-t-lg border-b">
                <CardTitle className="flex items-center gap-2 text-xl text-black">
                  <AlertTriangle className="h-5 w-5 text-indigo-600" />
                  {viewMode === 'visited' ? 'Visited Shops Report' : 
                   viewMode === 'unvisited' ? 'Unvisited Shops Report' : 
                   'All Shops Report'}
                  {loadingDetails && (
                    <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  )}
                </CardTitle>
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
                          <th className="text-left p-4 font-semibold text-slate-700">Shop Name</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Address</th>
                          <th className="text-left p-4 font-semibold text-slate-700">City</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Phone</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Validation Score</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Visits</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Last Visit</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getCurrentShops().map((shop, index) => (
                          <tr key={shop.id || index} className="border-b hover:bg-slate-50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-slate-900">
                                  {shop.name || 'N/A'}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
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
                                <Phone className="h-4 w-4 text-indigo-500" />
                                <span className="text-slate-600 text-sm">
                                  {shop.phone || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="font-semibold text-yellow-700">
                                  {shop.validationScore ? `${shop.validationScore.toFixed(1)}%` : 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {shop.visitImages?.length || 0} visits
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-amber-500" />
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
                      router.push(`/dashboard/shops/${shop.id}`)
                    }}
                    className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Shop Details
                  </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Performance Summary - Only show in main view */}
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
                    <span className="font-bold text-indigo-700">{topAuditor}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Average Score:</span>
                    <span className="font-bold text-green-700">{avgValidationScore}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Reports Generated:</span>
                    <span className="font-bold text-blue-700">{reportsGenerated}</span>
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
                    <span className="font-bold text-green-700">
                      {totalShops > 0 ? Math.round((visitedCount / totalShops) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
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