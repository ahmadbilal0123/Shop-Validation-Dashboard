"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import {
  registerUser,
  fetchAllUsers,
  updateUser,
  type User,
  fetchAssignedShopsForAuditor,
  fetchShops,
  type Shop,
} from "@/lib/api"
import { getSession } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  UserPlus,
  Edit3,
  Calendar,
  Shield,
  UserIcon,
  Crown,
  Eye,
  EyeOff,
  Briefcase,
  Search,
  Filter,
  Package,
  RefreshCw,
  MapPin,
} from "lucide-react"

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
  const [formKey, setFormKey] = useState(0)
  const [userShopCounts, setUserShopCounts] = useState<{ [userId: string]: number }>({})

  const [assignedUser, setAssignedUser] = useState<User | null>(null)
  const [assignedShops, setAssignedShops] = useState<Shop[]>([])
  const [assignedLoading, setAssignedLoading] = useState(false)
  const [assignedError, setAssignedError] = useState<string | null>(null)

  const editFormRef = useRef<HTMLDivElement>(null)

  // Only load users ONCE on mount. No auto-refresh or focus reload!
  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    const res = await fetchAllUsers()
    if (res.success) {
      setUsers(res.users)
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

      await Promise.all(
        usersList.map(async (user) => {
          try {
            let totalCount = 0
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
                },
              )
              if (response.ok) {
                const data = await response.json()
                totalCount = data.count || 0
              }
            } else if (user.role === "manager" || user.role === "salesperson" || user.role === "saleperson") {
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
                totalCount = shops.filter((shop: any) => shop.assignedQc === user.id).length
              }
            } else {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shops/get-shops`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session?.token}`,
                  "ngrok-skip-browser-warning": "true",
                },
              })
              if (response.ok) {
                totalCount = 0
              }
            }
            counts[user.id] = totalCount
          } catch (error) {
            console.error(`Error fetching shop count for user ${user.id}:`, error)
            counts[user.id] = 0
          }
        }),
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
      setForm({ name: "", username: "", password: "", role: "user" })
      setSuccess("🎉 User registered successfully!")
      setShowPassword(false)
      setFormKey((prev) => prev + 1)
      await loadUsers()
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
      setShowEditPassword(false)
      await loadUsers()
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
    const grayBadge = "bg-gray-100 text-gray-800 border-gray-200"
    return grayBadge
  }

  const getRoleIcon = (role: string) => {
    const icons = {
      admin: Crown,
      manager: Briefcase,
      supervisor: Shield,
      executive: UserIcon,
      auditor: Eye,
      qc: Eye,
      user: UserIcon,
    }
    const Icon = icons[role as keyof typeof icons] || UserIcon
    return <Icon className="h-4 w-4" />
  }

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: "Admin",
      manager: "Manager",
      supervisor: "Supervisor",
      executive: "Executive",
      auditor: "Auditor",
      qc: "QC",
      user: "User",
    }
    return roleNames[role as keyof typeof roleNames] || role
  }

  const filteredUsers = users.filter((user) => {
    return roleFilter === "all" || user.role === roleFilter
  })

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
      } else if (user.role === "manager" || user.role === "salesperson" || user.role === "saleperson") {
        const res = await fetchShops()
        if (res.success) {
          setAssignedShops(res.shops.filter((shop) => (shop as any).assignedQc === user.id))
        } else {
          setAssignedError(res.error || "Failed to load assigned shops")
        }
      } else {
        setAssignedShops([])
      }
    } catch (e) {
      setAssignedError("Network error occurred")
    }
    setAssignedLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
      <div className="w-full p-4 sm:p-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-3 mb-6 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 text-center">User Management</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1 text-center">Manage user accounts and permissions</p>
          </div>
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
              Register New User
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
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-slate-700">Role</Label>
                <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
                  <SelectTrigger className="border-slate-200 focus:border-gray-700 focus:ring-gray-700 text-sm sm:text-base">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                    <SelectItem value="qc">QC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-black hover:bg-gray-900 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base w-full sm:w-auto"
                >
                  {submitting ? "Registering..." : "Add User"}
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
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Role</Label>
                  <Select
                    value={editForm.role || "user"}
                    onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                  >
                    <SelectTrigger className="border-slate-200 focus:border-gray-700 focus:ring-gray-700">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                      <SelectItem value="auditor">Auditor</SelectItem>
                      <SelectItem value="qc">QC</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-black hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {submitting ? "Updating..." : "Update User"}
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
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Users Directory</h2>
            </div>
            <div className="w-full sm:w-auto sm:ml-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40 border-slate-200 bg-white">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />
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
              <Badge variant="secondary" className="bg-gray-200 text-gray-800 text-xs sm:text-sm px-2 py-1">
                {filteredUsers.length} {filteredUsers.length === 1 ? "User" : "Users"}
              </Badge>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
              <span className="ml-3 text-gray-700">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600 text-lg">
                  {roleFilter === "all" ? "No users found." : `No ${roleFilter}s found.`}
                </p>
                <p className="text-slate-500 text-sm">
                  {roleFilter === "all"
                    ? "Start by registering your first user above."
                    : "Try selecting a different role filter."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredUsers.map((user) => (
                <Card
                  key={user.id}
                  className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <CardHeader className="pb-3 p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="p-1.5 sm:p-2 bg-slate-100 rounded-lg flex-shrink-0">
                          {getRoleIcon(user.role)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm sm:text-lg text-slate-900 truncate">{user.name}</CardTitle>
                          <p className="text-xs sm:text-sm text-slate-600 truncate">@{user.username}</p>
                        </div>
                      </div>
                      <Badge className={`${getRoleColor(user.role)} border text-xs font-medium flex-shrink-0 ml-2`}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 p-4 sm:p-6">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
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
                      Edit User
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

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
                  <p className="text-sm sm:text-base">No shops assigned to this user.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4">
                  {assignedShops.map((shop) => (
                    <Card key={shop.id} className="border shadow hover:shadow-lg transition-all">
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
    </div>
  )
}