"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import {
  registerUser,
  updateUser,
  type User,
  fetchShops,
  type Shop,
} from "@/lib/api"
import { getSession } from "@/lib/auth"
import { useAuthContext } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  UserPlus,
  Edit3,
  Calendar,
  UserIcon,
  Eye,
  EyeOff,
  Search,
  Filter,
  Package,
  RefreshCw,
  MapPin,
  ArrowLeft,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { ManagerSidebar } from "@/components/manager-sidebar"

export default function UsersPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuthContext()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "saleperson" })
  const [editForm, setEditForm] = useState<Partial<User> | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [formKey, setFormKey] = useState(0)
  const [userShopCounts, setUserShopCounts] = useState<{ [userId: string]: number }>({})

  const [assignedUser, setAssignedUser] = useState<User | null>(null)
  const [assignedShops, setAssignedShops] = useState<Shop[]>([])
  const [assignedLoading, setAssignedLoading] = useState(false)
  const [assignedError, setAssignedError] = useState<string | null>(null)

  const [showPassword, setShowPassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  const editFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only load users when authentication is ready and user is authenticated
    if (!authLoading && user) {
      loadUsers()
    }
  }, [authLoading, user])

  useEffect(() => {
    // Set up event listeners and intervals only when user is authenticated
    if (!user) return

    const handleFocus = () => loadUsers()
    const interval = setInterval(() => {
      if (users.length > 0) loadUserShopCounts(users)
    }, 30000)
    window.addEventListener("focus", handleFocus)
    return () => {
      window.removeEventListener("focus", handleFocus)
      clearInterval(interval)
    }
  }, [user, users])

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const session = getSession()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/get-salepersons`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.token}`,
          "ngrok-skip-browser-warning": "true",
        },
      })
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }
      const data = await response.json()
      const list = (data && (data.data || data.users)) || []
      setUsers(list)
      await loadUserShopCounts(list)
    } catch (e: any) {
      setError(e?.message || "Failed to load users")
    }
    setLoading(false)
  }

  const loadUserShopCounts = async (usersList: User[]) => {
    try {
      const counts: { [userId: string]: number } = {}
      const session = getSession()
      await Promise.all(
        usersList.map(async (user) => {
          try {
            let totalCount = 0
            // For salesperson, use the general shops API and filter
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shops/get-shops`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.token}`,
                "ngrok-skip-browser-warning": "true",
              },
            })
            if (response.ok) {
              const data = await response.json()
              const shops = data.data || []
              totalCount = shops.filter(
                (shop: any) => shop.assignedTo === user.id
              ).length
            }
            counts[user.id] = totalCount
          } catch (error) {
            counts[user.id] = 0
          }
        }),
      )
      setUserShopCounts(counts)
    } catch (error) {}
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    // Always send role: "saleperson" to API
    const res = await registerUser({ ...form, role: "saleperson" })
    if (res.success) {
      setForm({ name: "", username: "", password: "", role: "saleperson" })
      setSuccess("🎉 Salesperson registered successfully!")
      setShowPassword(false)
      setFormKey((prev) => prev + 1)
      await loadUsers()
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(res.error || "Failed to register salesperson")
    }
    setSubmitting(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm?.id) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    // Always send role: "saleperson" to API
    const res = await updateUser(editForm.id, { ...editForm, role: "saleperson" })
    if (res.success) {
      setSuccess("✅ Salesperson updated successfully!")
      setEditForm(null)
      setShowEditPassword(false)
      await loadUsers()
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(res.error || "Failed to update salesperson")
    }
    setSubmitting(false)
  }

  useEffect(() => {
    if (editForm && editFormRef.current) {
      editFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [editForm])

  const getRoleColor = () => "bg-gray-100 text-gray-800 border-gray-200"
  const getRoleIcon = () => <UserIcon className="h-4 w-4" />
  const getRoleDisplayName = () => "Salesperson"

  // Only show salespersons
  const filteredUsers = users.filter((user) => user.role === "saleperson")

  const handleUserCardClick = async (user: User) => {
    setAssignedUser(user)
    setAssignedShops([])
    setAssignedLoading(true)
    setAssignedError(null)
    try {
      // For salesperson, fetch and filter
      const res = await fetchShops()
      if (res.success) {
        setAssignedShops(res.shops.filter((shop) => shop.assignedTo === user.id))
      } else {
        setAssignedError(res.error || "Failed to load assigned shops")
      }
    } catch (e) {
      setAssignedError("Network error occurred")
    }
    setAssignedLoading(false)
  }

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show error if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      <main className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-3 mb-6 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 text-center">User Management</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1 text-center">Manage salesperson accounts</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border-gray-300 text-gray-800 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={loadUsers}
              variant="outline"
              className="flex items-center gap-2 border-gray-300 text-gray-800 hover:bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-transparent"
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="border-gray-300 bg-gray-50">
            <AlertDescription className="text-gray-800">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-gray-300 bg-gray-50">
            <AlertDescription className="text-gray-800 font-medium">{success}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-white rounded-t-lg border-b">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-black">
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
              Register New Salesperson
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form key={formKey} onSubmit={handleRegister} className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-slate-700">Full Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="border-slate-200 focus:border-gray-700 focus:ring-gray-700 text-sm sm:text-base"
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-slate-700">Username</Label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  className="border-slate-200 focus:border-gray-700 focus:ring-gray-700 text-sm sm:text-base"
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-slate-700">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="border-slate-200 focus:border-gray-700 focus:ring-gray-700 pl-10 text-sm sm:text-base"
                    placeholder="Enter secure password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </button>
                </div>
              </div>
              {/* Role is hidden, always saleperson */}
              <input type="hidden" value="saleperson" />
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-black hover:bg-gray-900 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base w-full sm:w-auto"
                >
                  {submitting ? "Registering..." : "Add Salesperson"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {editForm && (
          <Card ref={editFormRef} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-white rounded-t-lg border-b">
              <CardTitle className="flex items-center gap-2 text-xl text-black">
                <Edit3 className="h-5 w-5" />
                Edit Salesperson
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdate} className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Full Name</Label>
                  <Input
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="border-slate-200 focus:border-gray-700 focus:ring-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Username</Label>
                  <Input
                    value={editForm.username || ""}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="border-slate-200 focus:border-gray-700 focus:ring-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Password</Label>
                  <div className="relative">
                    <Input
                      type={showEditPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={editForm.password || ""}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      className="border-slate-200 focus:border-gray-700 focus:ring-gray-700 pl-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                    >
                      {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <small className="text-slate-500">Leave blank to keep the current password</small>
                </div>
                {/* Role is hidden, always saleperson */}
                <input type="hidden" value="saleperson" />
                <div className="md:col-span-2 flex gap-3">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-black hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {submitting ? "Updating..." : "Update Salesperson"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditForm(null)}
                    className="border-slate-300 text-slate-700 hover:bg-gray-100 px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Users Directory */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Search className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Salespersons Directory</h2>
            </div>
            <div className="w-full sm:w-auto sm:ml-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Badge variant="secondary" className="bg-gray-200 text-gray-800 text-xs sm:text-sm px-2 py-1">
                {filteredUsers.length} {filteredUsers.length === 1 ? "Salesperson" : "Salespersons"}
              </Badge>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
              <span className="ml-3 text-gray-700">Loading salespersons...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600 text-lg">No salespersons found.</p>
                <p className="text-slate-500 text-sm">
                  Start by registering your first salesperson above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredUsers.map((user) => {
                const uid = (user as any).id || (user as any)._id || user.username
                return (
                <Card
                  key={uid}
                  className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <CardHeader className="pb-3 p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="p-1.5 sm:p-2 bg-slate-100 rounded-lg flex-shrink-0">
                          {getRoleIcon()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm sm:text-lg text-slate-900 truncate">{user.name}</CardTitle>
                          <p className="text-xs sm:text-sm text-slate-600 truncate">@{user.username}</p>
                        </div>
                      </div>
                      <Badge className={`${getRoleColor()} border text-xs font-medium flex-shrink-0 ml-2`}>
                        {getRoleDisplayName()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 p-4 sm:p-6">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Assigned Shops Count */}
                    <div
                      className="relative flex items-center gap-2 text-xs sm:text-sm text-gray-800 mb-3 sm:mb-4 bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer group"
                      onClick={() => handleUserCardClick(user)}
                    >
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="font-semibold truncate flex-1">
                        {userShopCounts[user.id] !== undefined ? userShopCounts[user.id] : "..."} Assigned Shops
                      </span>
                      <div className="relative">
                        <div className="flex items-center justify-center w-5 h-5 text-gray-800 font-bold text-xs group-hover:bg-gray-300 group-hover:scale-125 transition-all duration-200">
                          ⓘ
                        </div>
                        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                          Click to see assigned shops
                          <div className="absolute top-full right-2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditForm(user)
                      }}
                      className="w-full bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-black text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
                    >
                      <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Edit Salesperson
                    </Button>
                  </CardContent>
                </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Assigned Shops Drawer/Modal */}
        {assignedUser && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setAssignedUser(null)} />
            <div className="relative ml-auto w-full max-w-xs sm:max-w-sm md:max-w-lg bg-white rounded-l-xl shadow-2xl p-4 sm:p-6 lg:p-8 overflow-y-auto">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4">
                Shops Assigned to {assignedUser.name}
              </h2>
              {assignedLoading ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-gray-800"></div>
                  <span className="ml-3 text-gray-700 text-sm sm:text-base">Loading shops...</span>
                </div>
              ) : assignedError ? (
                <Alert className="border-gray-300 bg-gray-50 mb-4 sm:mb-6">
                  <AlertDescription className="text-gray-800 text-sm sm:text-base">{assignedError}</AlertDescription>
                </Alert>
              ) : assignedShops.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-slate-500">
                  <Package className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base">No shops assigned to this salesperson.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4">
                  {assignedShops.map((shop, idx) => (
                    <Card key={(shop as any).id || (shop as any)._id || idx} className="border shadow hover:shadow-lg transition-all">
                      <CardHeader className="p-3 sm:p-4">
                        <CardTitle className="text-sm sm:text-lg font-bold text-blue-700 truncate">
                          {shop.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="flex items-start gap-2 text-xs sm:text-sm mb-2">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-600 break-words">
                            {shop.address}, {shop.city}, {shop.state} {shop.zipCode}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600 mb-2">
                          <span className="flex items-center gap-1">
                            Status: <Badge className="bg-gray-200 text-gray-800 text-xs">{shop.status}</Badge>
                          </span>
                          <span>Visits: {shop.visitImages?.length || 0}</span>
                        </div>
                        {shop.lastVisit && (
                          <div className="mt-2 text-xs text-slate-500">
                            Last Visit: {new Date(shop.lastVisit).toLocaleDateString()}
                          </div>
                        )}
                        <Button
                          size="sm"
                          className="mt-3 sm:mt-4 w-full bg-gradient-to-r from-gray-800 to-black text-white text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 hover:from-gray-900 hover:to-black"
                          onClick={() => (window.location.href = `/dashboard/shops/${shop.id}`)}
                        >
                          View Shop Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                className="mt-4 sm:mt-6 w-full border-gray-300 text-gray-800 text-sm sm:text-base px-3 sm:px-4 py-2 bg-transparent hover:bg-gray-100"
                onClick={() => setAssignedUser(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
      </main>
    </div>
  )
}