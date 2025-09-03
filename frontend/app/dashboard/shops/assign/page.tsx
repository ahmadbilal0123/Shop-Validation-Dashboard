"use client"

import { useEffect, useState } from "react"
import { fetchShopById } from "@/lib/api"
import { useRouter, useSearchParams } from "next/navigation"
import { getSession } from "@/lib/auth"
import { assignShopsToUser} from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Users, Search, UserCheck, Package, Grid3X3, List } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function AssignShopsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [selectedAuditorId, setSelectedAuditorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    // Load preference from localStorage, default to 'list'
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('auditorViewMode');
      return (savedMode === 'grid' || savedMode === 'list') ? savedMode as 'list' | 'grid' : 'list';
    }
    return 'list';
  })

  // Function to handle view mode changes and save to localStorage
  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auditorViewMode', mode);
    }
  };

  const shopIds = searchParams.get("shopIds")?.split(",") || []
  const [shopNames, setShopNames] = useState<{ [id: string]: string }>({})

  useEffect(() => {
    async function loadShopNames() {
      // Only fetch if shopIds are non-empty and not already loaded
      const idsToFetch = shopIds.filter(id => !shopNames[id])
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
        toast({
          title: "Authentication Error",
          description: "No authentication token found. Please log in.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/get-assignies`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      })

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        // Use .users if present, else .auditors
        const rawList = usersData.users || usersData.auditors || []
        const mappedUsers = rawList.map((auditor: any) => ({
          id: auditor._id,
          name: auditor.username,
          email: auditor.username,
          role: auditor.role,
        }))
        setUsers(mappedUsers)
      }
    } catch (error) {
      console.error("Error loading users:", error)
      toast({
        title: "Error",
        description: "Error loading users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssignShops = async () => {
    if (!selectedAuditorId) {
      toast({
        title: "No Auditor Selected",
        description: "Please select an auditor before assigning shops.",
        variant: "destructive",
      })
      return
    }

    setAssigning(true)
    try {
      const selectedAuditor = users.find(u => u.id === selectedAuditorId)
      const result = await assignShopsToUser(selectedAuditorId, shopIds, selectedAuditor?.role || "auditor")

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Shops assigned successfully!",
        })
        router.push("/dashboard/shops")
      } else {
        toast({
          title: "Already Assigned",
          description: result.error || "Some shops are already assigned.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Assign error:", error)
      toast({
        title: "Error",
        description: (error as Error).message || "Error assigning shops.",
        variant: "destructive",
      })
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
    <div className="h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 overflow-hidden">
      {/* Fixed Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-blue-100 z-40 shadow-sm py-4 sm:py-5 flex-shrink-0">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4 relative">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/shops")}
              className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 h-10 px-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Shops
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-blue-900 absolute left-1/2 transform -translate-x-1/2">
              Assign Shops to Auditors
            </h1>
            <div></div> {/* Invisible spacer for balance */}
          </div>

          {/* Selected Shops Display Section - Compact */}
          <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl border border-blue-200 shadow-sm p-3 sm:p-4 mb-4">
            <h2 className="text-base sm:text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Selected Shops ({shopIds.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {shopIds.map((shopId, index) => (
                <div
                  key={shopId}
                  className="bg-white/80 backdrop-blur-sm rounded-lg border border-blue-200 shadow-sm p-2 sm:p-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center text-white font-bold text-xs">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{shopNames[shopId] || `Shop #${shopId.slice(-6)}`}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs bg-green-50 border-green-200 text-green-700 font-semibold w-full sm:w-auto justify-center">
                <Users className="w-3 h-3 mr-1" />
                {selectedAuditorId ? 1 : 0} Auditor Selected
              </Badge>
              <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs bg-blue-50 border-blue-200 text-blue-700 font-semibold w-full sm:w-auto justify-center">
                <Package className="w-3 h-3 mr-1" />
                {shopIds.length} Shops to Assign
              </Badge>
            </div>
            <Button
              onClick={handleAssignShops}
              disabled={assigning || !selectedAuditorId}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
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

      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-shrink-0 px-4 sm:px-6 pt-2">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-lg p-4 sm:p-6 h-[calc(100vh-140px)] flex flex-col">
              <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                Select Auditors
              </h2>
            </div>

            {/* Search Users + View Toggle - Compact */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4" />
                <Input
                  placeholder="Search auditors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400 h-9"
                />
              </div>
              <div className="flex border border-blue-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('list')}
                  className={`px-3 py-2 h-9 rounded-none ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-blue-600'}`}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('grid')}
                  className={`px-3 py-2 h-9 rounded-none border-l border-blue-200 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-blue-600'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Users List/Grid - Scrollable area */}
            <div className="flex-1 overflow-y-auto pr-2" style={{minHeight: '300px', maxHeight: 'calc(100vh - 400px)'}}>
              {viewMode === 'list' ? (
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <Card
                      key={user.id}
                      className={`bg-white/90 backdrop-blur-sm border rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer ${
                        selectedAuditorId === user.id
                          ? "border-blue-300 ring-2 ring-blue-200 shadow-sm"
                          : "border-blue-100 hover:border-blue-200"
                      }`}
                      onClick={() => setSelectedAuditorId(user.id)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="auditor"
                            checked={selectedAuditorId === user.id}
                            onChange={() => setSelectedAuditorId(user.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">{user.name}</div>
                            <div className="text-xs text-gray-600 mt-0.5 truncate">{user.email}</div>
                            <Badge variant="secondary" className="text-xs mt-1 bg-blue-100 text-blue-800 border-blue-200 px-2 py-0.5">
                              {user.role}
                            </Badge>
                          </div>
                          {selectedAuditorId === user.id && (
                            <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-green-100 rounded-full">
                              <UserCheck className="w-3 sm:w-4 h-3 sm:h-4 text-green-600" />
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
                        selectedAuditorId === user.id
                          ? "border-blue-300 ring-2 ring-blue-200 shadow-sm"
                          : "border-blue-100 hover:border-blue-200"
                      }`}
                      onClick={() => setSelectedAuditorId(user.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            name="auditor"
                            checked={selectedAuditorId === user.id}
                            onChange={() => setSelectedAuditorId(user.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500 mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{user.name}</div>
                            <div className="text-xs text-gray-600 mt-0.5 truncate">{user.email}</div>
                            <Badge variant="secondary" className="text-xs mt-1 bg-blue-100 text-blue-800 border-blue-200 px-1 py-0.5">
                              {user.role}
                            </Badge>
                          </div>
                          {selectedAuditorId === user.id && (
                            <div className="flex items-center justify-center w-5 h-5 bg-green-100 rounded-full flex-shrink-0">
                              <UserCheck className="w-3 h-3 text-green-600" />
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
  );
}
