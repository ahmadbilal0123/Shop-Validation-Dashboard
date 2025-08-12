"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Store, Users, MapPin, TrendingUp, RefreshCw, ArrowRight } from "lucide-react"
import { fetchShops, type Shop } from "@/lib/api"
import { useAuthContext } from "@/components/auth-provider"
import { formatRelativeTime } from "@/lib/utils"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useAuthContext()
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalShops: 0,
    activeShops: 0,
    pendingShops: 0,
    totalVisits: 0,
    avgValidationScore: 0,
  })

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const response = await fetchShops({  })

      if (response.success) {
        setShops(response.shops)

        // Calculate stats
        const totalShops = response.total
        const activeShops = response.shops.filter((shop) => shop.status === "active").length
        const pendingShops = response.shops.filter((shop) => shop.status === "pending").length
        const totalVisits = response.shops.reduce((sum, shop) => sum + shop.visitCount, 0)
        const avgValidationScore =
          response.shops.reduce((sum, shop) => sum + (shop.validationScore || 0), 0) / response.shops.length

        setStats({
          totalShops,
          activeShops,
          pendingShops,
          totalVisits,
          avgValidationScore: Math.round(avgValidationScore),
        })
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}! Here's your shop validation overview.</p>
        </div>
        <Button onClick={loadDashboardData} disabled={loading} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShops}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeShops} active, {stats.pendingShops} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisits}</div>
            <p className="text-xs text-muted-foreground">Across all shops</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Validation Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgValidationScore}%</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Shops</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeShops}</div>
            <p className="text-xs text-muted-foreground">Currently operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Shops */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Shops</CardTitle>
            <CardDescription>Latest shops in your system</CardDescription>
          </div>
          <Link href="/dashboard/shops">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : shops.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No shops found. Check your API connection.</div>
          ) : (
            <div className="space-y-4">
              {shops.map((shop) => (
                <div key={shop.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-medium">{shop.name}</h3>
                        <p className="text-sm text-gray-600">
                          {shop.city}, {shop.state}
                        </p>
                      </div>
                      <Badge className={getStatusColor(shop.status)}>{shop.status}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{shop.visitCount} visits</div>
                    {shop.lastVisit && (
                      <div className="text-xs text-gray-500">{formatRelativeTime(shop.lastVisit)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
