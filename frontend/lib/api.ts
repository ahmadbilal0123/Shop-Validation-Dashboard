import { buildApiUrl } from "./utils"

// Shop interface
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
}

// API response interface
export interface ShopsResponse {
  success: boolean
  shops: Shop[]
  total: number
  page: number
  limit: number
  error?: string
}

// Fetch shops from backend
export async function fetchShops(params?: {
  page?: number
  limit?: number
  status?: string
  city?: string
  search?: string
}): Promise<ShopsResponse> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.status) queryParams.append("status", params.status)
    if (params?.city) queryParams.append("city", params.city)
    if (params?.search) queryParams.append("search", params.search)

    const apiUrl = buildApiUrl("/api/shops/get-shop")
    const urlWithParams = queryParams.toString() ? `${apiUrl}?${queryParams.toString()}` : apiUrl

    console.log("Fetching shops from:", urlWithParams)

    const response = await fetch(urlWithParams, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    const data = await response.json()
    console.log("Shops response:", data)

    if (response.ok && data) {
      return {
        success: true,
        shops: data.shops || data.data || data,
        total: data.total || data.shops?.length || 0,
        page: data.page || 1,
        limit: data.limit || 10,
      }
    } else {
      return {
        success: false,
        shops: [],
        total: 0,
        page: 1,
        limit: 10,
        error: data.message || data.error || "Failed to fetch shops",
      }
    }
  } catch (error) {
    console.error("Error fetching shops:", error)
    return {
      success: false,
      shops: [],
      total: 0,
      page: 1,
      limit: 10,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}

// Fetch single shop by ID
export async function fetchShopById(shopId: string): Promise<{
  success: boolean
  shop?: Shop
  error?: string
}> {
  try {
    const apiUrl = buildApiUrl(`/api/shops/get-shop/${shopId}`)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    const data = await response.json()

    if (response.ok && data) {
      return {
        success: true,
        shop: data.shop || data,
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
