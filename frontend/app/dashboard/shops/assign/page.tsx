"use client"

import { useEffect, useState } from "react"
import { fetchShopById } from "@/lib/api"
import { useRouter, useSearchParams } from "next/navigation"
import { getSession } from "@/lib/auth"
import { assignShopsToUser } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Users, Search, UserCheck, Package, Grid3X3, List } from "lucide-react"
import {
  showAssignmentNotification,
  showErrorNotification,
  showAssignmentErrorNotification,
} from "@/lib/notifications"

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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("userViewMode")
      return savedMode === "grid" || savedMode === "list" ? (savedMode as "list" | "grid") : "list"
    }
    return "list"
  })

  const handleViewModeChange = (mode: "list" | "grid") => {
    setViewMode(mode)
    if (typeof window !== "undefined") {
      localStorage.setItem("userViewMode", mode)
    }
  }

  const shopIds = searchParams.get("shopIds")?.split(",") || []
  const [shopNames, setShopNames] = useState<{ [id: string]: string }>({})

  useEffect(() => {
    async function loadShopNames() {
      const idsToFetch = shopIds.filter((id) => !shopNames[id])
      if (idsToFetch.length === 0) return
      const names: { [id: string]: string } = { ...shopNames }
      await Promise.all(
        idsToFetch.map(async (id) => {
          const res = await fetchShopById(id)
          if (res.success && res.data?.name) {
            names[id] = res.data.name
          } else {
            names[id] = `Shop #${id.slice(-6)}`
          }
        })
      )
      setShopNames(names)
    }
    if (shopIds.length > 0) loadShopNames()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopIds])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const session = await getSession()
      const token = session?.token

      if (!token) {
        showErrorNotification("Authentication Error", "No authentication token found. Please log in.")
        router.push("/login")
        return
      }

      const usersRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/get-assignies`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      )

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        const rawList = usersData.users || usersData.auditors || []

        const mappedUsers = rawList.map((u: any) => ({
          id: u._id,
          name: u.username,
          email: u.username,
          role: u.role,
        }))

        // ✅ Show all users
        setUsers(mappedUsers)

        if (mappedUsers.length === 0) {
          showErrorNotification("No Users Found", "No users are available for assignment.")
        }
      } else {
        showErrorNotification("Failed to Load Users", "Unable to fetch user list from server.")
      }
    } catch (error) {
      console.error("Error loading users:", error)
      showErrorNotification("Error", "Error loading users. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAssignShops = async () => {
    if (!selectedUserId) {
      showErrorNotification("No User Selected", "Please select a user before assigning shops.")
      return
    }

    setAssigning(true)
    try {
      const selectedUser = users.find((u) => u.id === selectedUserId)

      const result = await assignShopsToUser(
        selectedUserId,
        shopIds,
        selectedUser?.role || "user"
      )

      if (result.success) {
        const assignedShopNames = shopIds.map(
          (id) => shopNames[id] || `Shop #${id.slice(-6)}`
        )

        showAssignmentNotification({
          userName: selectedUser?.name || "Unknown User",
          userRole: selectedUser?.role || "user",
          shopCount: shopIds.length,
          shopNames: assignedShopNames,
        })

        router.push("/dashboard/shops")
      } else {
        if (
          result.error?.includes("already assigned") ||
          (result.alreadyAssigned && result.alreadyAssigned.length > 0)
        ) {
          const alreadyAssignedNames = result.alreadyAssigned
            ? result.alreadyAssigned.map(
                (id: string) => shopNames[id] || `Shop #${id.slice(-6)}`
              )
            : []

          showAssignmentErrorNotification(
            "Assignment Failed",
            result.error || "Some shops are already assigned to another user.",
            alreadyAssignedNames
          )
        } else {
          showErrorNotification("Assignment Error", result.error || "Failed to assign shops.")
        }
      }
    } catch (error) {
      console.error("Assign error:", error)
      showErrorNotification("Error", (error as Error).message || "Error assigning shops.")
    } finally {
      setAssigning(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 z-40 shadow-sm py-4 sm:py-5 flex-shrink-0">
        <div className="w-full px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4 relative">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/shops")}
              className="flex items-center gap-2 border-gray-300 text-gray-800 hover:bg-gray-100 h-10 px-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Shops
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 absolute left-1/2 transform -translate-x-1/2">
              Assign Shops to Users
            </h1>
            <div></div>
          </div>

          {/* Selected Shops */}
          <div className="bg-gray-50 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Selected Shops ({shopIds.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {shopIds.map((shopId, index) => (
                <div
                  key={shopId}
                  className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm p-2 sm:p-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-800 rounded-md flex items-center justify-center text-white font-bold text-xs">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                        {shopNames[shopId] || `Shop #${shopId.slice(-6)}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status & Assign Button */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Badge
                variant="outline"
                className="px-2 sm:px-3 py-1 text-xs bg-gray-100 border-gray-300 text-gray-800 font-semibold w-full sm:w-auto justify-center"
              >
                <Users className="w-3 h-3 mr-1" />
                {selectedUserId ? 1 : 0} User Selected
              </Badge>
              <Badge
                variant="outline"
                className="px-2 sm:px-3 py-1 text-xs bg-gray-100 border-gray-300 text-gray-800 font-semibold w-full sm:w-auto justify-center"
              >
                <Package className="w-3 h-3 mr-1" />
                {shopIds.length} Shops to Assign
              </Badge>
            </div>
            <Button
              onClick={handleAssignShops}
              disabled={assigning || !selectedUserId}
              className="bg-black hover:bg-gray-900 text-white px-4 py-2 text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {assigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Assign Shops
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-shrink-0 px-4 sm:px-6 pt-2">
          <div className="w-full">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-4 sm:p-6 h-[calc(100vh-140px)] flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 sm:w-5 h-4 sm:h-5 text-gray-700" />
                  Select Users ({filteredUsers.length})
                </h2>
              </div>

              {/* Search & View Toggle */}
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-gray-700 focus:ring-gray-700 h-9"
                  />
                </div>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewModeChange("list")}
                    className={`px-3 py-2 h-9 rounded-none ${
                      viewMode === "list" ? "bg-black text-white" : "text-gray-800"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewModeChange("grid")}
                    className={`px-3 py-2 h-9 rounded-none border-l border-gray-300 ${
                      viewMode === "grid" ? "bg-black text-white" : "text-gray-800"
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Users List/Grid */}
              <div
                className="flex-1 overflow-y-auto pr-2"
                style={{ minHeight: "300px", maxHeight: "calc(100vh - 400px)" }}
              >
                {filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
                    <p className="text-gray-600 max-w-sm">
                      {searchQuery
                        ? `No users match "${searchQuery}". Try adjusting your search.`
                        : "No users are currently available for shop assignment."}
                    </p>
                  </div>
                ) : viewMode === "list" ? (
                  <div className="space-y-3">
                    {filteredUsers.map((user) => (
                      <Card
                        key={user.id}
                        className={`bg-white/90 backdrop-blur-sm border rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer ${
                          selectedUserId === user.id
                            ? "border-gray-400 ring-2 ring-gray-300 shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="user"
                              checked={selectedUserId === user.id}
                              onChange={() => setSelectedUserId(user.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 text-black border-gray-400 rounded focus:ring-gray-700"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                {user.name}
                              </div>
                              <div className="text-xs text-gray-600 mt-0.5 truncate">
                                {user.email}
                              </div>
                              <Badge
                                variant="secondary"
                                className="text-xs mt-1 bg-gray-200 text-gray-800 border-gray-300 px-2 py-0.5"
                              >
                                {user.role}
                              </Badge>
                            </div>
                            {selectedUserId === user.id && (
                              <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-gray-800 rounded-full">
                                <UserCheck className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredUsers.map((user) => (
                      <Card
                        key={user.id}
                        className={`bg-white/90 backdrop-blur-sm border rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer ${
                          selectedUserId === user.id
                            ? "border-gray-400 ring-2 ring-gray-300 shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <input
                              type="radio"
                              name="user"
                              checked={selectedUserId === user.id}
                              onChange={() => setSelectedUserId(user.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 text-black border-gray-400 rounded focus:ring-gray-700 mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                                {user.name}
                              </div>
                              <div className="text-xs text-gray-600 mt-0.5 truncate">
                                {user.email}
                              </div>
                              <Badge
                                variant="secondary"
                                className="text-xs mt-1 bg-gray-200 text-gray-800 border-gray-300 px-1 py-0.5"
                              >
                                {user.role}
                              </Badge>
                            </div>
                            {selectedUserId === user.id && (
                              <div className="flex items-center justify-center w-5 h-5 bg-gray-800 rounded-full flex-shrink-0">
                                <UserCheck className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
