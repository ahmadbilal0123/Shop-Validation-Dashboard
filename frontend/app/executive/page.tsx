"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Store,
  Users,
  BarChart3,
  RefreshCw,
  Eye,
  MapPin,
  Calendar,
  User,
  LogOut,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth" // ✅ assumes you have a useAuth hook

// ✅ Define the Shop type
interface Shop {
  id: string
  name: string
  address: string
  location: string
  addedDate: string
  visits: number
}

export default function ManagerDashboard() {
  const router = useRouter()
  const { user, logout } = useAuth() // ✅ get user + logout function from auth

  // Example structure of user: { name: "John Doe", role: "Admin" }
  const shops: Shop[] = [] // This will be populated from API
  const totalShops: number = 0 // This will come from API
  const selectedShops: number = 0 // This will be managed by state

  const handleLogout = () => {
    logout() // clear auth/session
    router.push("/login") // redirect to login
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-xl font-semibold">ShelfVoice</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-blue-800 bg-blue-800"
            >
              <LayoutDashboard className="w-4 h-4 mr-3" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-blue-800"
            >
              <Store className="w-4 h-4 mr-3" />
              Shop Details
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-blue-800"
            >
              <Users className="w-4 h-4 mr-3" />
              Users
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-blue-800"
            >
              <BarChart3 className="w-4 h-4 mr-3" />
              Reports
            </Button>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-blue-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-medium">
                {user?.name || "Guest User"}
              </div>
              <div className="text-xs text-blue-300">
                {user?.role || "No Role"}
              </div>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-red-400 hover:bg-red-600 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                Executive Dashboard
              </h1>
              <p className="text-gray-600">
                Efficiently manage and assign shops to auditors or all the users
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 px-4 py-2"
              >
                <Store className="w-4 h-4 mr-2" />
                {totalShops} Total Shops
              </Badge>

              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Shop Grid */}
        <div className="flex-1 p-6">
          {shops.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Store className="w-12 h-12 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No shops found</h3>
              <p className="text-sm">Connect your API to load shop data</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop) => (
                <Card key={shop.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {shop.name}
                      </h3>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{shop.address}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {shop.location}
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-orange-400" />
                        <span>Added {shop.addedDate}</span>
                      </div>

                      <div className="text-sm">
                        <span className="text-gray-600">Visits: </span>
                        <span className="font-semibold text-blue-600">
                          {shop.visits}
                        </span>
                      </div>

                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <Eye className="w-4 h-4 mr-2" />
                        View Shop Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
