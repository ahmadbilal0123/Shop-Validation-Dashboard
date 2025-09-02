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
} from "lucide-react"
import { useAuthContext } from "@/components/auth-provider"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
} from "@/components/ui/sheet"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Auditors",
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

  const hasPermission = (permission?: string) => {
    if (!permission) return true
    if (!user) return false
    if (user.role === "admin" || user.permissions.includes("all")) return true
    return user.permissions.includes(permission)
  }

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 shadow-2xl">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-slate-700/50 bg-gradient-to-r from-blue-600/20 to-blue-600/20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Store className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">
           ShelfSense
          </h1>
        </div>
      </div>

      {/* Navigation */}
     <nav className="flex-1 space-y-2 px-4 py-6">
  {navigation.map((item) => {
    if (!hasPermission(item.permission)) return null

    // Dropdown logic
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)

    if (item.children) {
      const isOpen = openDropdown === item.name
      return (
        <div key={item.name}>
          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-slate-300 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-600/20 transition-all duration-200 flex items-center"
            onClick={() =>
              setOpenDropdown(isOpen ? null : item.name)
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            <span className="font-medium">{item.name}</span>
            <span className="ml-auto">{isOpen ? "▲" : "▼"}</span>
          </Button>

          {isOpen &&
            item.children.map((child) => {
              const isActive = pathname === child.href
              return (
                <Link key={child.name} href={child.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-12 pl-10 text-slate-300 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-600/20 transition-all duration-200",
                      isActive &&
                        "bg-gradient-to-r from-blue-600/30 to-blue-600/30 text-white border-slate-600/50 shadow-lg"
                    )}
                  >
                    <child.icon className="mr-3 h-5 w-5" />
                    {child.name}
                  </Button>
                </Link>
              )
            })}
        </div>
      )
    }

    const isActive = pathname === item.href
    return (
      <Link key={item.name} href={item.href}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-12 text-slate-300 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-600/20 transition-all duration-200",
            isActive &&
              "bg-gradient-to-r from-blue-600/30 to-blue-600/30 text-white border-slate-600/50 shadow-lg"
          )}
        >
          <item.icon className="mr-3 h-5 w-5" />
          <span className="font-medium">{item.name}</span>
          {isActive && (
            <div className="ml-auto w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
          )}
        </Button>
      </Link>
    )
  })}
</nav>


      {/* User Info & Logout */}
      <div className="border-t border-slate-700/50 p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            logout()
            onNavigate?.()
          }}
          className="w-full justify-start bg-gradient-to-black from-red-600/20 to-red-500/20 border-red-500/30 text-red-500 hover:text-white hover:bg-gradient-to-r hover:from-red-600/100 hover:to-red-500/40"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile: Sheet */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent onNavigate={() => setOpen(false)} />
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
