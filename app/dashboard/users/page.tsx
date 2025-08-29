"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { registerUser, fetchAllUsers, updateUser, type User } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Edit3, Calendar, Shield, UserIcon, Crown, Eye, Briefcase, Search, Filter } from "lucide-react"

export default function UsersPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "user" })
  const [editForm, setEditForm] = useState<Partial<User> | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<string>("all")

  const editFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    const res = await fetchAllUsers()
    if (res.success) {
      setUsers(res.users)
    } else {
      setError(res.error || "Failed to load users")
    }
    setLoading(false)
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
      await loadUsers()
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
      await loadUsers()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-600 mt-1">Manage user accounts and permissions</p>
          </div>
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
            <form onSubmit={handleRegister} className="grid gap-6 md:grid-cols-2">
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
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter secure password"
                />
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
                    <SelectItem value="qc">qc</SelectItem> {/* qc role */}
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
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={editForm.password || ""}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
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
                  <SelectItem value="qc">qc</SelectItem>
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
                  className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
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
                    <Button
                      size="sm"
                      onClick={() => setEditForm(user)}
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
      </div>
    </div>
  )
}