"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Sheet,
  SheetTrigger,
  SheetContent,
} from "@/components/ui/sheet"
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
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved === 'true';
    }
    return false;
  })
  const [openDropdowns, setOpenDropdowns] = useState<string[]>(() => {
    // Load expanded dropdowns from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarDropdowns');
      return saved ? JSON.parse(saved) : ['Shop Details'];
    }
    return ['Shop Details'];
  })
  const [searchQuery, setSearchQuery] = useState("")

  // Save collapse state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
    }
  }, [isCollapsed])

  // Save dropdown states to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarDropdowns', JSON.stringify(openDropdowns));
    }
  }, [openDropdowns])

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const toggleDropdown = (itemName: string) => {
    setOpenDropdowns(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const hasPermission = (permission?: string) => {
    if (!permission) return true
    if (!user) return false
    if (user.role === "admin" || user.permissions.includes("all")) return true
    return user.permissions.includes(permission)
  }

  // Filter navigation items based on search
  const filteredNavigation = navigation.filter(item => {
    if (!searchQuery) return true
    const matchesMain = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesChildren = item.children?.some(child => 
      child.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    return matchesMain || matchesChildren
  })

  const SidebarContent = ({ onNavigate, isMobile = false }: { onNavigate?: () => void; isMobile?: boolean }) => {
    const shouldCollapse = isCollapsed && !isMobile
    const sidebarWidth = shouldCollapse ? "w-16" : "w-64"
    
    return (
      <div className={cn(
        "flex h-full flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 shadow-2xl transition-all duration-300",
        sidebarWidth
      )}>
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-slate-700/50 bg-gradient-to-r from-blue-600/20 to-blue-600/20 transition-all duration-300",
          shouldCollapse ? "px-2" : "px-6"
        )}>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            {!shouldCollapse && (
              <h1 className="text-xl font-bold text-white">
                ShelfSense
              </h1>
            )}
          </div>
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className={cn(
                "h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200",
                shouldCollapse ? "ml-0" : "ml-auto"
              )}
            >
              {shouldCollapse ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Search Bar */}
        {/* {!shouldCollapse && (
          <div className="px-4 py-3 border-b border-slate-700/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search navigation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-600/50 text-slate-200 placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20 h-9"
              />
            </div>
          </div>
        )} */}

        {/* Navigation */}
        <nav className={cn(
          "flex-1 space-y-1 py-4 overflow-y-auto",
          shouldCollapse ? "px-2" : "px-4"
        )}>
          {filteredNavigation.map((item) => {
            if (!hasPermission(item.permission)) return null

            if (item.children) {
              const isOpen = openDropdowns.includes(item.name)
              const hasActiveChild = item.children.some(child => pathname === child.href)
              
              return (
                <div key={item.name} className="space-y-1">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-12 text-slate-300 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-600/20 transition-all duration-200 group",
                      shouldCollapse ? "justify-center px-0" : "justify-start",
                      hasActiveChild && "bg-gradient-to-r from-blue-600/20 to-blue-600/20 text-blue-300"
                    )}
                    onClick={() => !shouldCollapse && toggleDropdown(item.name)}
                    title={shouldCollapse ? item.name : undefined}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 transition-colors duration-200",
                      hasActiveChild && "text-blue-400"
                    )} />
                    {!shouldCollapse && (
                      <>
                        <span className="ml-3 font-medium">{item.name}</span>
                        <div className="ml-auto">
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </>
                    )}
                  </Button>

                  {/* Dropdown Items */}
                  {(isOpen || shouldCollapse) && !shouldCollapse &&
                    item.children.map((child) => {
                      const isActive = pathname === child.href
                      const matchesSearch = !searchQuery || child.name.toLowerCase().includes(searchQuery.toLowerCase())
                      if (!matchesSearch) return null
                      
                      return (
                        <Link key={child.name} href={child.href} onClick={onNavigate}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start h-10 pl-12 text-slate-300 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-600/20 transition-all duration-200 group",
                              isActive &&
                                "bg-gradient-to-r from-blue-600/30 to-blue-600/30 text-white border-l-2 border-blue-500 shadow-lg"
                            )}
                          >
                            <child.icon className={cn(
                              "mr-3 h-4 w-4 transition-colors duration-200",
                              isActive && "text-blue-400"
                            )} />
                            <span className="font-medium">{child.name}</span>
                            {isActive && (
                              <div className="ml-auto w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
                            )}
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
                    "w-full h-12 text-slate-300 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-600/20 transition-all duration-200 group",
                    shouldCollapse ? "justify-center px-0" : "justify-start",
                    isActive &&
                      "bg-gradient-to-r from-blue-600/30 to-blue-600/30 text-white border-slate-600/50 shadow-lg"
                  )}
                  title={shouldCollapse ? item.name : undefined}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    isActive && "text-blue-400"
                  )} />
                  {!shouldCollapse && (
                    <>
                      <span className="ml-3 font-medium">{item.name}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
                      )}
                    </>
                  )}
                </Button>
              </Link>
            )
          })}

          {/* No Search Results */}
          {searchQuery && filteredNavigation.length === 0 && !shouldCollapse && (
            <div className="text-center py-8">
              <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No navigation items found</p>
            </div>
          )}
        </nav>

        {/* User Info & Logout */}
        <div className={cn(
          "border-t border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-700/50 transition-all duration-300",
          shouldCollapse ? "p-2" : "p-4"
        )}>
          {!shouldCollapse && (
            <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-600/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400 capitalize font-medium">
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <Button
            variant="outline"
            size={shouldCollapse ? "icon" : "sm"}
            onClick={() => {
              logout()
              onNavigate?.()
            }}
            className={cn(
              "justify-start bg-gradient-to-r from-red-600/20 to-red-500/20 border-red-500/30 text-red-400 hover:text-white hover:bg-gradient-to-r hover:from-red-600/40 hover:to-red-500/40 transition-all duration-200",
              shouldCollapse ? "w-10 h-10" : "w-full"
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
            <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
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
