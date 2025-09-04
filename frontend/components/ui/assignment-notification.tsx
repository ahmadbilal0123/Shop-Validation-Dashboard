"use client"

import { CheckCircle, User, Package, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface AssignmentNotificationProps {
  userName: string
  userRole: string
  shopCount: number
  shopNames?: string[]
  className?: string
}

export function AssignmentNotification({
  userName,
  userRole,
  shopCount,
  shopNames = [],
  className
}: AssignmentNotificationProps) {
  const displayShops = shopNames.slice(0, 3)
  const remainingCount = shopCount - displayShops.length

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-lg",
      className
    )}>
      {/* Success Icon */}
      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-5 h-5 text-green-600" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-green-600" />
          <h4 className="font-semibold text-green-900 text-sm">
            Assignment Successful!
          </h4>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-800">
            <span className="font-medium">{userName}</span>
            <span className="text-green-600 ml-1">({userRole.toUpperCase()})</span>
          </span>
        </div>

        {/* Shop Count */}
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-800">
            <span className="font-medium">{shopCount}</span> shop{shopCount !== 1 ? 's' : ''} assigned
          </span>
        </div>

        {/* Shop Names Preview */}
        {displayShops.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-green-700 mb-1">Assigned shops:</div>
            <div className="flex flex-wrap gap-1">
              {displayShops.map((shopName, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md border border-green-200"
                >
                  {shopName}
                </span>
              ))}
              {remainingCount > 0 && (
                <span className="inline-block px-2 py-1 bg-green-200 text-green-800 text-xs rounded-md border border-green-300">
                  +{remainingCount} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
