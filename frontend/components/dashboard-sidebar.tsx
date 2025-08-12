"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Store, Users, MapPin, BarChart3, Settings, LogOut } from "lucide-react"
import { useAuthContext } from "@/components/auth-provider"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Shops",
    href: "/dashboard/shops",
    icon: Store,
  },
  {
    name: "Visits",
    href: "/dashboard/visits",
    icon: MapPin,
  },
  {
    name: "Users",
    href: "/dashboard/users",
    icon: Users,
    permission: "manage_users",
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthContext()

  const hasPermission = (permission?: string) => {
    if (!permission) return true
    if (!user) return false
    if (user.role === "admin" || user.permissions.includes("all")) return true
    return user.permissions.includes(permission)
  }

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 shadow-2xl">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-slate-700/50 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Store className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Shop Validation
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4 py-6">
        {navigation.map((item) => {
          if (!hasPermission(item.permission)) return null

          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-12 text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-200 border border-transparent hover:border-slate-600/50 backdrop-blur-sm",
                  isActive &&
                    "bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white border-slate-600/50 shadow-lg shadow-blue-500/10",
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                )}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-slate-700/50 p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm">
        <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-600/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize bg-gradient-to-r from-blue-400/80 to-purple-400/80 bg-clip-text text-transparent font-medium">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="w-full justify-start bg-gradient-to-r from-red-600/20 to-red-500/20 border-red-500/30 text-red-300 hover:text-white hover:bg-gradient-to-r hover:from-red-600/40 hover:to-red-500/40 hover:border-red-400/50 transition-all duration-200"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
