"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Store,
  Users,
  MapPin,
  LogOut,
  Menu,
  TriangleAlert,
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useAuthContext } from "@/components/auth-provider"
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"
import { useState, useEffect } from "react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Shop Details",
    icon: Users,
    children: [
      { name: "Visits", href: "/dashboard/visits", icon: MapPin },
      { name: "Shops", href: "/dashboard/shops", icon: Store },
      { name: "Pending", href: "/dashboard/pending", icon: TriangleAlert },
    ],
  },
  { name: "Users", href: "/dashboard/users", icon: Users, permission: "manage_users" },
  { name: "Reports", href: "/dashboard/reports", icon: TriangleAlert, permission: "manage_users" },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthContext()
  const [open, setOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load collapse state from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarCollapsed")
      return saved === "true"
    }
    return false
  })
  const [openDropdowns, setOpenDropdowns] = useState<string[]>(() => {
    // Load expanded dropdowns from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarDropdowns")
      return saved ? JSON.parse(saved) : ["Shop Details"]
    }
    return ["Shop Details"]
  })
  const [searchQuery, setSearchQuery] = useState("")

  // Save collapse state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarCollapsed", isCollapsed.toString())
    }
  }, [isCollapsed])

  // Save dropdown states to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarDropdowns", JSON.stringify(openDropdowns))
    }
  }, [openDropdowns])

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const toggleDropdown = (itemName: string) => {
    setOpenDropdowns((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName],
    )
  }

  const hasPermission = (permission?: string) => {
    if (!permission) return true
    if (!user) return false
    if (user.role === "admin" || user.permissions.includes("all")) return true
    return user.permissions.includes(permission)
  }

  // Filter navigation items based on search
  const filteredNavigation = navigation.filter((item) => {
    if (!searchQuery) return true
    const matchesMain = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesChildren = item.children?.some((child) => child.name.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesMain || matchesChildren
  })

  const handleLogout = () => {
    // Close Shop Details dropdown on logout
    setOpenDropdowns((prev) => prev.filter((name) => name !== "Shop Details"))
    logout()
  }

  const SidebarContent = ({ onNavigate, isMobile = false }: { onNavigate?: () => void; isMobile?: boolean }) => {
    const shouldCollapse = isCollapsed && !isMobile
    const sidebarWidth = shouldCollapse ? "w-16" : "w-64"

    return (
      <div
        className={cn(
          "flex h-full flex-col bg-white border-r border-gray-200 shadow-lg transition-all duration-300",
          sidebarWidth,
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 transition-all duration-300",
            shouldCollapse ? "px-2" : "px-6",
          )}
        >
          <div className="flex items-center space-x-2">
         
            {!shouldCollapse && <h1 className="text-xl font-bold text-gray-900 tracking-tight">ShelfVoice</h1>}
          </div>
          
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 space-y-1 py-4 overflow-y-auto", shouldCollapse ? "px-2" : "px-4")}>
          {filteredNavigation.map((item) => {
            if (!hasPermission(item.permission)) return null

            if (item.children) {
              const isOpen = openDropdowns.includes(item.name)
              const hasActiveChild = item.children.some((child) => pathname === child.href)

              return (
                <div key={item.name} className="space-y-1">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-12 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 group border border-transparent",
                      shouldCollapse ? "justify-center px-0" : "justify-start",
                      hasActiveChild && "bg-blue-50 text-blue-700 border-blue-200 shadow-sm",
                    )}
                    onClick={() => !shouldCollapse && toggleDropdown(item.name)}
                    title={shouldCollapse ? item.name : undefined}
                  >
                    <item.icon
                      className={cn("h-5 w-5 transition-colors duration-200", hasActiveChild && "text-blue-600")}
                    />
                    {!shouldCollapse && (
                      <>
                        <span className="ml-3 font-medium">{item.name}</span>
                        <div className="ml-auto">
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </>
                    )}
                  </Button>

                  {/* Dropdown Items */}
                  {(isOpen || shouldCollapse) &&
                    !shouldCollapse &&
                    item.children.map((child, index) => {
                      const isActive = pathname === child.href
                      const matchesSearch = !searchQuery || child.name.toLowerCase().includes(searchQuery.toLowerCase())
                      const isLast = index === item.children!.length - 1
                      if (!matchesSearch) return null

                      return (
                        <Link key={child.name} href={child.href} onClick={onNavigate}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start h-10 pl-8 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all duration-200 group relative border border-transparent",
                              isActive && "bg-blue-50 text-blue-700 border-blue-200 shadow-sm",
                            )}
                          >
                            {/* Simple curve indicator before icon */}
                            <span className="text-gray-400 text-sm font-mono mr-2">{isLast ? "└─" : "├─"}</span>
                            <child.icon
                              className={cn("mr-3 h-4 w-4 transition-colors duration-200", isActive && "text-blue-600")}
                            />
                            <span className="font-medium">{child.name}</span>
                            {isActive && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full shadow-sm" />}
                          </Button>
                        </Link>
                      )
                    })}
                </div>
              )
            }

            // Regular navigation items
            const isActive = pathname === item.href
            const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
            if (!matchesSearch) return null

            return (
              <Link key={item.name} href={item.href} onClick={onNavigate}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full h-12 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 group border border-transparent",
                    shouldCollapse ? "justify-center px-0" : "justify-start",
                    isActive && "bg-blue-50 text-blue-700 border-blue-200 shadow-sm",
                  )}
                  title={shouldCollapse ? item.name : undefined}
                >
                  <item.icon className={cn("h-5 w-5 transition-colors duration-200", isActive && "text-blue-600")} />
                  {!shouldCollapse && (
                    <>
                      <span className="ml-3 font-medium">{item.name}</span>
                      {isActive && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full shadow-sm" />}
                    </>
                  )}
                </Button>
              </Link>
            )
          })}

          {/* No Search Results */}
          {searchQuery && filteredNavigation.length === 0 && !shouldCollapse && (
            <div className="text-center py-8">
              <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No navigation items found</p>
            </div>
          )}
        </nav>

        {/* User Info & Logout */}
        <div
          className={cn(
            "border-t border-gray-200 bg-gray-50 transition-all duration-300",
            shouldCollapse ? "p-2" : "p-4",
          )}
        >
          {!shouldCollapse && (
            <div className="mb-4 p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize font-medium">{user?.role}</p>
                </div>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size={shouldCollapse ? "icon" : "sm"}
            onClick={() => {
              handleLogout()
              onNavigate?.()
            }}
            className={cn(
              "justify-start bg-red-50 border-red-200 text-red-600 hover:text-red-700 hover:bg-red-100 transition-all duration-200",
              shouldCollapse ? "w-10 h-10" : "w-full",
            )}
            title={shouldCollapse ? "Logout" : undefined}
          >
            <LogOut className={cn("h-4 w-4", !shouldCollapse && "mr-2")} />
            {!shouldCollapse && "Logout"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile: Sheet */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent onNavigate={() => setOpen(false)} isMobile={true} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Fixed Sidebar */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>
    </>
  )
}
