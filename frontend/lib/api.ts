import { buildApiUrl } from "./utils"
import { getSession } from "./auth"

export interface VisitImage {
  _id?: string
  shopImage?: string
  shelfImage?: string
}

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
  assignedAt?: string
  auditorId?: string

  // ✅ New fields
  visit?: boolean
  visitImages?: VisitImage[]
}

export interface ShopsResponse {
  success: boolean
  shops: Shop[]
  total: number
  error?: string
}

export interface AssignedShopsResponse {
  success: boolean
  shops: Shop[]
  total: number
  auditorId: string
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
      "ngrok-skip-browser-warning": "true",
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
      const shops: Shop[] = (data.data || []).map((shop: any) => ({
        id: shop._id || shop.id,
        name: shop.name || shop.shop_name || "Unnamed Shop",
        address: shop.address || shop.shop_address || "",
        city: shop.city || shop.city_village || "",
        state: shop.state || shop.ptc_urbanity || "",
        zipCode: shop.zipCode || shop.zip_code || "",
        phone: shop.phone || shop.contact_number || "",
        email: shop.email || shop.contact_email || "",
        status: shop.status || "active",
        coordinates: shop.coordinates || (shop.lat && shop.lng ? { lat: shop.lat, lng: shop.lng } : undefined),
        lastVisit: shop.lastVisit || shop.last_visit,
        visitCount: shop.visitCount || shop.visit_count || 0,
        validationScore: shop.validationScore || shop.validation_score,
        createdAt: shop.createdAt || shop.created_at || new Date().toISOString(),
        updatedAt: shop.updatedAt || shop.updated_at || new Date().toISOString(),
        ptc_urbanity: shop.ptc_urbanity || "",
        city_village: shop.city_village || "",

        // ✅ Add image field (visitImages)
        visit: shop.visit ?? false,
        visitImages: Array.isArray(shop.visitImages)
          ? shop.visitImages.map((img: any) => ({
              _id: img._id,
              shopImage: img.shopImage || img.shop_image || "",
              shelfImage: img.shelfImage || img.shelf_image || "",
            }))
          : [],
      }))

      return {
        success: true,
        shops,
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

export async function fetchAssignedShopsForAuditor(
  auditorId: string,
  params?: {
    status?: string
    city?: string
    search?: string
    page?: number
    limit?: number
  },
): Promise<AssignedShopsResponse> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.status && params.status !== "all") queryParams.append("status", params.status)
    if (params?.city) queryParams.append("city", params.city)
    if (params?.search) queryParams.append("search", params.search)

    const apiUrl = buildApiUrl(`/api/users/get-assigned-shops-for-auditor/${auditorId}`)
    const urlWithParams = queryParams.toString() ? `${apiUrl}?${queryParams.toString()}` : apiUrl
    console.log("Auditor API URL:", urlWithParams)

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
        auditorId,
        error: `Server returned non-JSON response (Status: ${response.status}). Raw: ${rawText.substring(0, 100)}...`,
      }
    }

    const data = await response.json()
    console.log("Raw API response:", data) // Added detailed logging

    if (response.status === 401) {
      return {
        success: false,
        shops: [],
        total: 0,
        auditorId,
        error: "Unauthorized. Please log in again.",
      }
    }

    if (response.ok && data) {
      let shopsArray = []

      // Try different possible response structures
      if (Array.isArray(data)) {
        // Direct array response
        shopsArray = data
        console.log("Response is direct array:", shopsArray.length, "items")
      } else if (data.data && Array.isArray(data.data)) {
        // Nested in data property
        shopsArray = data.data
        console.log("Response has data property:", shopsArray.length, "items")
      } else if (data.shops && Array.isArray(data.shops)) {
        // Nested in shops property
        shopsArray = data.shops
        console.log("Response has shops property:", shopsArray.length, "items")
      } else if (data.assignedShops && Array.isArray(data.assignedShops)) {
        // Nested in assignedShops property
        shopsArray = data.assignedShops
        console.log("Response has assignedShops property:", shopsArray.length, "items")
      } else {
        console.log("Unknown response structure:", Object.keys(data))
        shopsArray = []
      }

      const shops: Shop[] = shopsArray.map((shop: any) => ({
        id: shop._id || shop.id,
        name: shop.name || shop.shop_name || "Unnamed Shop",
        address: shop.address || shop.shop_address || "",
        city: shop.city || shop.city_village || "",
        state: shop.state || shop.ptc_urbanity || "",
        zipCode: shop.zipCode || shop.zip_code || "",
        phone: shop.phone || shop.contact_number || "",
        email: shop.email || shop.contact_email || "",
        status: shop.status || "active",
        coordinates: shop.coordinates || (shop.lat && shop.lng ? { lat: shop.lat, lng: shop.lng } : undefined),
        lastVisit: shop.lastVisit || shop.last_visit,
        visitCount: shop.visitCount || shop.visit_count || 0,
        validationScore: shop.validationScore || shop.validation_score,
        createdAt: shop.createdAt || shop.created_at || new Date().toISOString(),
        updatedAt: shop.updatedAt || shop.updated_at || new Date().toISOString(),
        ptc_urbanity: shop.ptc_urbanity || "",
        city_village: shop.city_village || "",
        assignedAt: shop.assignedAt || shop.assigned_at,
        auditorId: shop.auditorId || shop.auditor_id || auditorId,
      }))

      console.log("Mapped shops:", shops.length, "items") // Added logging

      return {
        success: true,
        shops,
        total: data.count || data.total || shops.length,
        auditorId,
      }
    }

    return {
      success: false,
      shops: [],
      total: 0,
      auditorId,
      error: data.message || data.error || "Failed to fetch assigned shops",
    }
  } catch (error) {
    console.error("Error in fetchAssignedShopsForAuditor:", error) // Enhanced error logging
    return {
      success: false,
      shops: [],
      total: 0,
      auditorId,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}

export async function fetchShopById(shopId: string): Promise<{
  success: boolean
  data?: any
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
      const rawShopData = data.data || data.shop || data

      const processedShopData = {
        ...rawShopData,
        visit: rawShopData.visit ?? false,
        visitImages: Array.isArray(rawShopData.visitImages)
          ? rawShopData.visitImages.map((img: any) => ({
              _id: img._id,
              shopImage: img.shopImage || img.shop_image || "",
              shelfImage: img.shelfImage || img.shelf_image || "",
            }))
          : [],
      }

      return {
        success: true,
        data: processedShopData,
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

export async function assignShopsToAuditor(
  auditorId: string,
  shopIds: string[],
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = getSession()
    if (!session?.token) {
      return { success: false, error: "No authentication token found" }
    }

    const url = buildApiUrl("/api/shops/assign-shops")

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ auditorId, shopIds }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const errorMessage =
        data.message ||
        data.error ||
        (response.status === 409
          ? "Shops already assigned to this auditor"
          : `Server error: ${response.status} ${response.statusText}`)

      return { success: false, error: errorMessage }
    }

    // ✅ Normalize response
    return {
      success: true,
      message: data.message || "Shops assigned successfully",
    }
  } catch (error) {
    console.error("Error assigning shops:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
