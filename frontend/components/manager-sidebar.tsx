"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import {
  LayoutDashboard,
  Users,
  Store,
  BarChart3,
  LogOut,
  Menu,
} from "lucide-react"

export function ManagerSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const NavLink = ({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) => {
    const isActive = pathname === href
    return (
      <Link href={href} onClick={() => setOpen(false)}>
        <Button
          variant="ghost"
          className={cn(
            "w-full h-12 justify-start text-gray-800 hover:bg-gray-100",
            isActive && "bg-gray-100 text-gray-900 border border-gray-300 shadow-sm",
          )}
        >
          <Icon className="w-4 h-4 mr-3" />
          {children}
        </Button>
      </Link>
    )
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white border-r border-gray-200 shadow-lg w-64">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <span className="text-xl font-semibold">ShelfVoice</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <NavLink href="/manager/reports" icon={BarChart3}>Reports</NavLink>
        <NavLink href="/manager" icon={LayoutDashboard}>Shops</NavLink>
        <NavLink href="/manager-users" icon={Users}>Add Salesperson</NavLink>
        {/* <NavLink href="" icon={Store}>Shop Details</NavLink> */}
      
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="mb-3">
          <div className="text-sm font-medium">{user?.name || "Guest User"}</div>
          <div className="text-xs text-gray-500">{user?.role || "No Role"}</div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
          onClick={() => {
            logout()
            router.push("/login")
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="md:hidden fixed right-3 top-3 z-40 flex items-center justify-center h-9 w-9 rounded-xl bg-white text-black border border-black/20 hover:bg-gray-50"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-full sm:w-80">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop: sticky sidebar */}
      <div className="hidden md:block md:sticky md:top-0 md:h-screen">
        <SidebarContent />
      </div>
    </>
  )
}


