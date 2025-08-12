import { buildApiUrl } from "./utils"
import { getSession } from "./auth" // Make sure this returns token synchronously or await it if async

export interface Shop {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone?: string
  email?: string
  status: "active" | "inactive" | "pending"
  coordinates?: {
    lat: number
    lng: number
  }
  lastVisit?: string
  visitCount: number
  validationScore?: number
  createdAt: string
  updatedAt: string
  ptc_urbanity?: string
  city_village?: string
}

export interface ShopsResponse {
  success: boolean
  shops: any[] // Changed from Shop[] to any[] to handle raw data
  total: number
  error?: string
}

export async function fetchShops(params?: {
  status?: string
  city?: string
  search?: string
  page?: number
  limit?: number
}): Promise<ShopsResponse> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.status && params.status !== "all") queryParams.append("status", params.status)
    if (params?.city) queryParams.append("city", params.city)
    if (params?.search) queryParams.append("search", params.search)
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())

    const apiUrl = buildApiUrl("/api/shops/get-shops")
    const urlWithParams = queryParams.toString() ? `${apiUrl}?${queryParams.toString()}` : apiUrl
    console.log("apiURL:", urlWithParams)

    const session = getSession()
    const token = session?.token

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true", // this bypasses ngrok's HTML warning
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    } else {
      console.warn("No authentication token found. Request might be unauthorized.")
    }

    const response = await fetch(urlWithParams, {
      method: "GET",
      headers,
    })

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const rawText = await response.text()
      return {
        success: false,
        shops: [],
        total: 0,
        error: `Server returned non-JSON response (Status: ${response.status}). Raw: ${rawText.substring(0, 100)}...`,
      }
    }

    const data = await response.json()

    if (response.status === 401) {
      return {
        success: false,
        shops: [],
        total: 0,
        error: "Unauthorized. Please log in again.",
      }
    }

    if (response.ok && data) {
      const shops = data.data || []

      return {
        success: true,
        shops, // Return raw shop data exactly as received from API
        total: data.count || shops.length,
      }
    }

    return {
      success: false,
      shops: [],
      total: 0,
      error: data.message || data.error || "Failed to fetch shops",
    }
  } catch (error) {
    return {
      success: false,
      shops: [],
      total: 0,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}

export async function fetchShopById(shopId: string): Promise<{
  success: boolean
  data?: any // Return complete raw data from API response
  error?: string
}> {
  try {
    const apiUrl = buildApiUrl(`/api/shops/get-shop/${shopId}`)

    const session = getSession()
    const token = session?.token

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    } else {
      console.warn(`No authentication token found for fetching shop ID ${shopId}. Request might be unauthorized.`)
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers,
    })

    const contentType = response.headers.get("content-type") || ""

    if (!contentType.includes("application/json")) {
      const rawText = await response.text()
      console.error("Non-JSON response from API for single shop:", rawText)
      return {
        success: false,
        error: `Server returned non-JSON response (Status: ${response.status}). Raw: ${rawText.substring(0, 100)}...`,
      }
    }

    const data = await response.json()

    if (response.status === 401) {
      console.error("Unauthorized access when fetching single shop.")
      return {
        success: false,
        error: "Unauthorized. Please log in again.",
      }
    }

    if (response.ok && data) {
      const shopData = data.data || data.shop || data

      return {
        success: true,
        data: shopData, // Return all raw data exactly as received from API
      }
    } else {
      return {
        success: false,
        error: data.message || data.error || "Failed to fetch shop",
      }
    }
  } catch (error) {
    console.error("Error fetching shop:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}
