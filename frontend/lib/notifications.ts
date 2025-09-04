import { toast } from "@/hooks/use-toast"

interface ShowAssignmentNotificationParams {
  userName: string
  userRole: string
  shopCount: number
  shopNames?: string[]
  message?: string
}

export function showAssignmentNotification({
  userName,
  userRole,
  shopCount,
  shopNames = [],
  message
}: ShowAssignmentNotificationParams) {
  const shopNamesText = shopNames.length > 0 
    ? shopNames.slice(0, 3).join(", ") + (shopNames.length > 3 ? ` +${shopNames.length - 3} more` : "")
    : ""
  
  const description = `${userName} (${userRole.toUpperCase()}) has been assigned ${shopCount} shop${shopCount !== 1 ? 's' : ''}${shopNamesText ? `: ${shopNamesText}` : ''}`
  
  toast({
    title: "✅ Assignment Successful!",
    description,
    className: "border-green-300 bg-gradient-to-r from-green-100 to-emerald-100 text-green-900 shadow-lg",
    duration: 5000
  })
}

// Regular success notification for other use cases
export function showSuccessNotification(title: string, description?: string) {
  toast({
    title: `✅ ${title}`,
    description,
    className: "border-green-300 bg-gradient-to-r from-green-100 to-emerald-100 text-green-900 shadow-lg",
    duration: 5000
  })
}

// Error notification
export function showErrorNotification(title: string, description?: string) {
  toast({
    title: `❌ ${title}`,
    description,
    variant: "destructive",
    className: "border-red-300 bg-gradient-to-r from-red-100 to-red-200 text-red-900 shadow-lg",
    duration: 6000 // Slightly longer for error messages
  })
}

// Assignment error notification (more specific)
export function showAssignmentErrorNotification(title: string, description: string, alreadyAssignedShops?: string[]) {
  let fullDescription = description
  
  if (alreadyAssignedShops && alreadyAssignedShops.length > 0) {
    fullDescription += ` Shops already assigned: ${alreadyAssignedShops.slice(0, 3).join(", ")}${alreadyAssignedShops.length > 3 ? ` +${alreadyAssignedShops.length - 3} more` : ''}`
  }
  
  toast({
    title: `⚠️ ${title}`,
    description: fullDescription,
    variant: "destructive", 
    className: "border-red-400 bg-gradient-to-r from-red-100 to-red-200 text-red-900 shadow-lg",
    duration: 7000 // Longer duration for assignment errors
  })
}
