"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSession } from "@/lib/auth"
import { assignShopsToAuditors } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Users, Search, UserCheck, Package } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function AssignShopsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Get selected shop IDs from URL params
  const shopIds = searchParams.get("shopIds")?.split(",") || []

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const session = await getSession()
      const token = session?.token

      if (!token) {
        alert("No authentication token found. Please log in.")
        router.push("/login")
        return
      }

      const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/get-auditors`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      })

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        const mappedUsers = (usersData.auditors || []).map((auditor: any) => ({
          id: auditor._id,
          name: auditor.username,
          email: auditor.username, // Using username as email since email is not provided
          role: auditor.role,
        }))
        setUsers(mappedUsers)
      }
    } catch (error) {
      console.error("Error loading users:", error)
      alert("Error loading users. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleAssignShops = async () => {
    if (selectedUserIds.length === 0) {
      alert("Please select at least one user.")
      return
    }

    setAssigning(true)
    try {
      await assignShopsToAuditors(selectedUserIds, shopIds)
      alert("Shops assigned successfully!")
      router.push("/dashboard/shops")
    } catch (error) {
      console.error("Assign error:", error)
      alert(`Error assigning shops: ${(error as Error).message}`)
    } finally {
      setAssigning(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/shops")}
              className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Shops
            </Button>
            <h1 className="text-4xl font-bold text-blue-900 font-sans">Assign Shops to Auditors</h1>
          </div>

          {/* Selected Shops Display Section */}
          <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl border border-blue-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Selected Shops ({shopIds.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {shopIds.map((shopId, index) => (
                <div
                  key={shopId}
                  className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-200 p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">Shop #{shopId.slice(-6)}</p>
                      <p className="text-xs text-gray-600 truncate">ID: {shopId}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Badge variant="outline" className="px-4 py-2 bg-green-50 border-green-200 text-green-700 font-semibold">
              <Users className="w-4 h-4 mr-2" />
              {selectedUserIds.length} Auditors Selected
            </Badge>
            <Badge variant="outline" className="px-4 py-2 bg-blue-50 border-blue-200 text-blue-700 font-semibold">
              <Package className="w-4 h-4 mr-2" />
              {shopIds.length} Shops to Assign
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Select Auditors
              </h2>
            </div>

            {/* Search Users */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4" />
              <Input
                placeholder="Search auditors by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>

            {/* Users List */}
            <div className="space-y-4 max-h-96 overflow-y-auto mb-8">
              {filteredUsers.map((user) => (
                <Card
                  key={user.id}
                  className={`bg-white/90 backdrop-blur-sm border rounded-xl transition-all duration-200 hover:shadow-md ${
                    selectedUserIds.includes(user.id)
                      ? "border-blue-300 ring-2 ring-blue-200 shadow-sm"
                      : "border-blue-100 hover:border-blue-200"
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        id={user.id}
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                        className="w-5 h-5 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <Label htmlFor={user.id} className="cursor-pointer">
                          <div className="font-semibold text-gray-900 text-lg">{user.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{user.email}</div>
                          <Badge variant="secondary" className="text-xs mt-2 bg-blue-100 text-blue-800 border-blue-200">
                            {user.role}
                          </Badge>
                        </Label>
                      </div>
                      {selectedUserIds.includes(user.id) && (
                        <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                          <UserCheck className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Assign Button */}
            <div className="mt-8">
              <Button
                onClick={handleAssignShops}
                disabled={assigning || selectedUserIds.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                {assigning ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Assigning Shops...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-5 h-5 mr-3" />
                    Assign {shopIds.length} Shops to {selectedUserIds.length} Auditors
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
