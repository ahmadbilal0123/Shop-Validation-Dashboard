"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { registerUser, fetchAllUsers, updateUser, type User, fetchAssignedShopsForAuditor, fetchShops, type Shop } from "@/lib/api"
import { getSession } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Edit3, Calendar, Shield, UserIcon, Crown, Eye, EyeOff, Briefcase, Search, Filter, Package, RefreshCw, MapPin } from "lucide-react"

export default function UsersPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "user" })
  const [editForm, setEditForm] = useState<Partial<User> | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [showPassword, setShowPassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [formKey, setFormKey] = useState(0) // Add key to force form re-render
  const [userShopCounts, setUserShopCounts] = useState<{ [userId: string]: number }>({})

  // New state for assigned shops detail
  const [assignedUser, setAssignedUser] = useState<User | null>(null)
  const [assignedShops, setAssignedShops] = useState<Shop[]>([])
  const [assignedLoading, setAssignedLoading] = useState(false)
  const [assignedError, setAssignedError] = useState<string | null>(null)

  const editFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadUsers()
    
    // Listen for focus events to refresh data when returning to the page
    const handleFocus = () => {
      loadUsers() // Refresh users and shop counts when page gets focus
    }
    
    // Auto-refresh shop counts every 30 seconds
    const interval = setInterval(() => {
      if (users.length > 0) {
        loadUserShopCounts(users)
      }
    }, 30000)
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    const res = await fetchAllUsers()
    if (res.success) {
      setUsers(res.users)
      // Load shop counts for each user
      await loadUserShopCounts(res.users)
    } else {
      setError(res.error || "Failed to load users")
    }
    setLoading(false)
  }

  const loadUserShopCounts = async (usersList: User[]) => {
    try {
      const counts: { [userId: string]: number } = {}
      const session = getSession()
      
      // Fetch shop count for each user using the correct API endpoint
      await Promise.all(
        usersList.map(async (user) => {
          try {
            let totalCount = 0

            // For auditors, use the specific API endpoint
            if (user.role === "auditor") {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/get-assigned-shops-for-auditor/${user.id}`,
                {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.token}`,
                    "ngrok-skip-browser-warning": "true",
                  },
                }
              )
              
              if (response.ok) {
                const data = await response.json()
                totalCount = data.count || 0
              }
            } else {
              // For other roles (including QC), fetch from general shops API and filter
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shops/get-shops`,
                {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.token}`,
                    "ngrok-skip-browser-warning": "true",
                  },
                }
              )
              
              if (response.ok) {
                const data = await response.json()
                const shops = data.data || []
                
                // Count shops assigned to this user (either as auditor or QC)
                totalCount = shops.filter((shop: any) => 
                  shop.assignedTo === user.id || shop.assignedQc === user.id
                ).length
              }
            }
            
            counts[user.id] = totalCount
          } catch (error) {
            console.error(`Error fetching shop count for user ${user.id}:`, error)
            counts[user.id] = 0
          }
        })
      )
      
      setUserShopCounts(counts)
    } catch (error) {
      console.error("Error loading user shop counts:", error)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const res = await registerUser(form)
    if (res.success) {
      // Clear form completely - this should clear all fields
      setForm({ name: "", username: "", password: "", role: "user" })
      setSuccess("🎉 User registered successfully!")
      setShowPassword(false) // Reset password visibility
      setFormKey(prev => prev + 1) // Force form re-render with new key
      await loadUsers()
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } else {
      setError(res.error || "Failed to register user")
    }
    setSubmitting(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm?.id) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const res = await updateUser(editForm.id, editForm)
    if (res.success) {
      setSuccess("✅ User updated successfully!")
      setEditForm(null)
      setShowEditPassword(false) // Reset edit password visibility
      await loadUsers()
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } else {
      setError(res.error || "Failed to update user")
    }
    setSubmitting(false)
  }

  useEffect(() => {
    if (editForm && editFormRef.current) {
      editFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [editForm])

  const getRoleColor = (role: string) => {
    const colors = {
      admin: "bg-red-100 text-red-800 border-red-200",
      manager: "bg-purple-100 text-purple-800 border-purple-200",
      supervisor: "bg-blue-100 text-blue-800 border-blue-200",
      executive: "bg-green-100 text-green-800 border-green-200",
      auditor: "bg-orange-100 text-orange-800 border-orange-200",
      qc: "bg-yellow-100 text-yellow-800 border-yellow-200", // QC role color
      user: "bg-gray-100 text-gray-800 border-gray-200",
    }
    return colors[role as keyof typeof colors] || colors.user
  }

  const getRoleIcon = (role: string) => {
    const icons = {
      admin: Crown,
      manager: Briefcase,
      supervisor: Shield,
      executive: UserIcon,
      auditor: Eye,
      qc: Eye, // You can change qc icon if needed
      user: UserIcon,
    }
    const Icon = icons[role as keyof typeof icons] || UserIcon
    return <Icon className="h-4 w-4" />
  }

  // Filter users based on role
  const filteredUsers = users.filter((user) => {
    return roleFilter === "all" || user.role === roleFilter
  })

  // Handler for clicking on user card to show assigned shops
  const handleUserCardClick = async (user: User) => {
    setAssignedUser(user)
    setAssignedShops([])
    setAssignedLoading(true)
    setAssignedError(null)
    try {
      if (user.role === "auditor") {
        const res = await fetchAssignedShopsForAuditor(user.id)
        if (res.success) {
          setAssignedShops(res.shops)
        } else {
          setAssignedError(res.error || "Failed to load assigned shops")
        }
      } else {
        // For other roles (including QC), fetch and filter
        const res = await fetchShops()
        if (res.success) {
          setAssignedShops(res.shops.filter(shop =>
            shop.assignedTo === user.id || shop.assignedQc === user.id
          ))
        } else {
          setAssignedError(res.error || "Failed to load assigned shops")
        }
      }
    } catch (e) {
      setAssignedError("Network error occurred")
    }
    setAssignedLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-600 mt-1">Manage user accounts and permissions</p>
          </div>
          <Button
            onClick={loadUsers}
            variant="outline"
            className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-white rounded-t-lg border-b">
            <CardTitle className="flex items-center gap-2 text-xl text-black">
              <UserPlus className="h-5 w-5" />
              Register New User
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form key={formKey} onSubmit={handleRegister} className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Full Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Username</Label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 pl-10"
                    placeholder="Enter secure password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Role</Label>
                <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
                  <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                    <SelectItem value="qc">QC</SelectItem> {/* qc role */}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {submitting ? "Registering..." : "Add User"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Edit form */}
        {editForm && (
          <Card ref={editFormRef} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-white rounded-t-lg border-b">
              <CardTitle className="flex items-center gap-2 text-xl text-black">
                <Edit3 className="h-5 w-5" />
                Edit User
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdate} className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Full Name</Label>
                  <Input
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Username</Label>
                  <Input
                    value={editForm.username || ""}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
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
                      className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 pl-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                    >
                      {showEditPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <small className="text-slate-500">Leave blank to keep the current password</small>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Role</Label>
                  <Select
                    value={editForm.role || "user"}
                    onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                  >
                    <SelectTrigger className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                      <SelectItem value="auditor">Auditor</SelectItem>
                      <SelectItem value="qc">QC</SelectItem> {/* qc role */}
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {submitting ? "Updating..." : "Update User"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditForm(null)}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-2 rounded-lg font-medium transition-colors"
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
          <div className="flex items-center gap-3 mb-6">
            <Search className="h-6 w-6 text-slate-600" />
            <h2 className="text-2xl font-bold text-slate-900">Users Directory</h2>
            <div className="ml-auto flex items-center gap-3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40 border-slate-200 bg-white">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-600" />
                    <SelectValue placeholder="Filter by role" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                  <SelectItem value="qc">QC</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {filteredUsers.length} {filteredUsers.length === 1 ? "User" : "Users"}
              </Badge>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-slate-600">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600 text-lg">
                  {roleFilter === "all"
                    ? "No users found."
                    : `No ${roleFilter}s found.`}
                </p>
                <p className="text-slate-500 text-sm">
                  {roleFilter === "all"
                    ? "Start by registering your first user above."
                    : "Try selecting a different role filter."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <Card
                  key={user.id}
                  className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  onClick={() => handleUserCardClick(user)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">{getRoleIcon(user.role)}</div>
                        <div>
                          <CardTitle className="text-lg text-slate-900">{user.name}</CardTitle>
                          <p className="text-sm text-slate-600">@{user.username}</p>
                        </div>
                      </div>
                      <Badge
                        className={`${getRoleColor(user.role)} border text-xs font-medium`}
                      >
                        {user.role}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                      <Calendar className="h-4 w-4" />
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    
                    {/* Assigned Shops Count */}
                    <div className="flex items-center gap-2 text-sm text-blue-600 mb-4 bg-blue-50 p-2 rounded-lg">
                      <Package className="h-4 w-4" />
                      <span className="font-semibold">
                        {userShopCounts[user.id] !== undefined ? userShopCounts[user.id] : "..."} Assigned Shops
                      </span>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditForm(user)
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit User
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Shops Drawer/Modal */}
        {assignedUser && (
          <div className="fixed inset-0 z-50 flex">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setAssignedUser(null)}
            />
            {/* Drawer */}
            <div className="relative ml-auto w-full max-w-lg bg-white rounded-l-xl shadow-2xl p-8 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                Shops Assigned to {assignedUser.name}
              </h2>
              {assignedLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-slate-600">Loading shops...</span>
                </div>
              ) : assignedError ? (
                <Alert variant="destructive" className="border-red-200 bg-red-50 mb-6">
                  <AlertDescription className="text-red-800">{assignedError}</AlertDescription>
                </Alert>
              ) : assignedShops.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Package className="h-10 w-10 mx-auto mb-4" />
                  <p>No shops assigned to this user.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {assignedShops.map(shop => (
                    <Card key={shop.id} className="border shadow hover:shadow-lg transition-all">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold text-blue-700">{shop.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span>{shop.address}, {shop.city}, {shop.state} {shop.zipCode}</span>
                        </div>
                        <div className="flex gap-4 text-sm text-slate-600">
                          <span>Status: <Badge className="bg-yellow-100 text-yellow-700">{shop.status}</Badge></span>
                          <span>Visits: {shop.visitCount}</span>
                        </div>
                        {shop.lastVisit && (
                          <div className="mt-2 text-xs text-slate-500">
                            Last Visit: {new Date(shop.lastVisit).toLocaleDateString()}
                          </div>
                        )}
                        <Button
                          size="sm"
                          className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                          onClick={() => window.open(`/dashboard/shops/${shop.id}`, "_blank")}
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
                className="mt-6 w-full border-slate-300 text-slate-700"
                onClick={() => setAssignedUser(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}