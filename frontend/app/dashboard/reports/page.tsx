"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { fetchShops, fetchVisitedShops, fetchAllUsers, type Shop, type User } from "@/lib/api"

export default function ReportsPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [visitedShops, setVisitedShops] = useState<Shop[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const shopsRes = await fetchShops()
    const visitedRes = await fetchVisitedShops()
    const usersRes = await fetchAllUsers()
    setShops(shopsRes.shops || [])
    setVisitedShops(visitedRes.shops || [])
    setUsers(usersRes.users || [])
    setLoading(false)
  }

  // Refresh function - exactly like other pages
  const refreshReports = async () => {
    await loadData()
  }

  // Calculate summary
  const totalShops = shops.length
  const visitedCount = visitedShops.length
  const pendingCount = totalShops - visitedCount
  const topAuditor = users.length > 0 ? users[0].name : "N/A"
  const reportsGenerated = visitedCount // Example: 1 report per visit
  const avgValidationScore = shops.length > 0
    ? Math.round(
        shops.reduce((sum, shop) => sum + (shop.validationScore || 0), 0) / shops.length
      )
    : 0

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
      <div className="container mx-auto p-6 max-w-5xl">
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
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mb-8">
          <CardHeader className="bg-white rounded-t-lg border-b">
            <CardTitle className="flex items-center gap-2 text-xl text-black">
              <AlertTriangle className="h-5 w-5 text-indigo-600" />
              Dynamic Report
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">Shop Summary</h2>
                <ul className="list-disc ml-6 text-slate-600">
                  <li>Total Shops: <span className="font-bold text-indigo-700">{totalShops}</span></li>
                  <li>Visited Shops: <span className="font-bold text-green-700">{visitedCount}</span></li>
                  <li>Pending Validation: <span className="font-bold text-yellow-700">{pendingCount}</span></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">Auditor Performance</h2>
                <ul className="list-disc ml-6 text-slate-600">
                  <li>Top Auditor: <span className="font-bold text-indigo-700">{topAuditor}</span></li>
                  <li>Average Validation Score: <span className="font-bold text-green-700">{avgValidationScore}%</span></li>
                  <li>Reports Generated: <span className="font-bold text-blue-700">{reportsGenerated}</span></li>
                </ul>
              </div>
            </div>
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Recent Activity</h2>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <ul className="text-slate-600 space-y-2">
                  {visitedShops.slice(0, 5).map((shop, idx) => (
                    <li key={shop.id || idx}>
                      Shop <span className="font-bold text-indigo-700">{shop.name}</span> validated
                      {shop.lastVisit ? ` on ${new Date(shop.lastVisit).toLocaleDateString()}` : ""}
                    </li>
                  ))}
                  {pendingCount > 0 && (
                    <li>Pending validations: <span className="font-bold text-yellow-700">{pendingCount}</span></li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}