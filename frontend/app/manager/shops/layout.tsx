"use client"

import type React from "react"
import { ManagerSidebar } from "@/components/manager-sidebar"

export default function ManagerShopsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}


