import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// HTTP to HTTPS utility function (from your original utility.js)
export function ensureHttps(url: string): string {
  if (!url) return ""

  // If URL starts with http://, replace with https://
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://")
  }

  // If URL doesn't have protocol, add https://
  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    return `https://${url}`
  }

  return url
}

// Get API base URL from environment
export function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!baseUrl) {
    console.warn("NEXT_PUBLIC_API_BASE_URL is not configured")
    return ""
  }
  return ensureHttps(baseUrl)
}

// Build full API URL
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl()
  if (!baseUrl) {
    throw new Error("API base URL is not configured")
  }

  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint

  // Handle relative paths like "./api/users/login"
  if (cleanEndpoint.startsWith("./")) {
    const relativePath = cleanEndpoint.slice(2) // Remove "./"
    return `${baseUrl}/${relativePath}`
  }

  // Handle absolute paths
  return `${baseUrl}/${cleanEndpoint}`
}

// Format date utility
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Capitalize first letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + "..."
}
