// updated: removed client-side sort inversion so requested sort is forwarded to the backend unchanged
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
  assignedTo?: string
  assignedQc?: string
  assignedManagerId?: string
  visit?: boolean
  visitImages?: VisitImage[]
  thirtyMeterRadius?: boolean
}

// Add pagination fields to response interface
export interface ShopsResponse {
  success: boolean
  shops: Shop[]
  total: number
  page?: number
  limit?: number
  totalPages?: number
  error?: string
}

export interface AssignedShopsResponse {
  success: boolean
  shops: Shop[]
  total: number
  auditorId: string
  error?: string
}

function transformShopData(shop: any, auditorId?: string): Shop {
  const mapped = {
    id: shop._id || shop.id,
    name: shop.name || shop.shop_name || "Unnamed Shop",
    address: shop.address || shop.shop_address || "",
    city: shop.city || shop.city_village || "",
    state: shop.state || shop.ptc_urbanity || "",
    zipCode: shop.zipCode || shop.zip_code || "",
    phone: shop.phone || shop.contact_number || "",
    status: shop.status || "active",
    coordinates:
      shop.coordinates ||
      (shop.lat && shop.lng
        ? { lat: shop.lat, lng: shop.lng }
        : shop.gps_n && shop.gps_e
        ? { lat: shop.gps_n, lng: shop.gps_e }
        : undefined),
    lastVisit: shop.lastVisit || shop.last_visit,
    visitCount: shop.visitCount || shop.visit_count || 0,
    validationScore: shop.validationScore || shop.validation_score,
    // Prefer backend timestamps. If backend didn't provide createdAt, leave it as ISO string fallback.
    createdAt: shop.createdAt || shop.created_at || new Date().toISOString(),
    updatedAt: shop.updatedAt || shop.updated_at || new Date().toISOString(),
    ptc_urbanity: shop.ptc_urbanity || "",
    city_village: shop.city_village || "",
    assignedAt: shop.assignedAt || shop.assigned_at,
    auditorId: shop.auditorId || shop.auditor_id || auditorId,
    assignedTo: shop.assignedTo,
    assignedQc: shop.assignedQc,
    assignedManagerId: shop.assignedManagerId,
    visit: shop.visit ?? false,
    visitImages: Array.isArray(shop.visitImages)
      ? shop.visitImages.map((img: any) => {
          const visitLocation = img.visitLocation || {}
          return {
            _id: img._id,
            shopImage: img.shopImage || img.shop_image || "",
            shelfImage: img.shelfImage || img.shelf_image || "",
            visitLocation,
            startAuditLat:
              img.startAuditLat ??
              img.start_audit_lat ??
              img.startAuditLocation?.lat ??
              visitLocation.startAudit?.latitude,
            startAuditLng:
              img.startAuditLng ??
              img.start_audit_lng ??
              img.startAuditLocation?.lng ??
              visitLocation.startAudit?.longitude,
            photoClickLat:
              img.photoClickLat ??
              img.photo_click_lat ??
              img.photoClickLocation?.lat ??
              visitLocation.photoClick?.latitude,
            photoClickLng:
              img.photoClickLng ??
              img.photo_click_lng ??
              img.photoClickLocation?.lng ??
              visitLocation.photoClick?.longitude,
            proceedClickLat:
              img.proceedClickLat ??
              img.proceed_click_lat ??
              img.proceedClickLocation?.lat ??
              visitLocation.proceedClick?.latitude,
            proceedClickLng:
              img.proceedClickLng ??
              img.proceed_click_lng ??
              img.proceedClickLocation?.lng ??
              visitLocation.proceedClick?.longitude,
          }
        })
      : [],
  };
  return { ...mapped, ...shop };
}

/**
 * buildQueryParams
 * - Accepts filters (status, city, search, unassigned, page, limit)
 * - Accepts optional sort and order parameters and forwards them to the backend AS-IS.
 * IMPORTANT: Removed client-side inversion so when caller requests createdAt:desc (newest first),
 * the backend will receive createdAt:desc and should return newest-first.
 */
function buildQueryParams(params?: {
  status?: string
  city?: string
  search?: string
  unassigned?: string
  page?: number
  limit?: number
  // optional sort inputs
  sort?: string
  order?: string
  shop_name?: string
}): string {
  if (!params) return ""
  const queryParams = new URLSearchParams()
  if (params.status && params.status !== "all") queryParams.append("status", params.status)
  if (params.city) queryParams.append("city", params.city)
  if (params.search) queryParams.append("search", params.search)

  // include shop_name if provided
  if (params.shop_name) queryParams.append("shop_name", params.shop_name)

  // Forward sort/order to backend unchanged.
  if (params.sort) {
    queryParams.append("sort", params.sort)
  }
  if (params.order) {
    queryParams.append("order", params.order)
  }

  if (params.unassigned) queryParams.append("unassigned", params.unassigned)
  if (params.page) queryParams.append("page", params.page.toString())
  if (params.limit) queryParams.append("limit", params.limit.toString())
  return queryParams.toString()
}

function buildAuthHeaders(): HeadersInit {
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
  return headers
}

async function validateResponse(response: Response): Promise<ShopsResponse | null> {
  const contentType = response.headers.get("content-type")
  if (!contentType?.includes("application/json")) {
    const rawText = await response.text()
    return buildError(
      `Server returned non-JSON response (Status: ${response.status}). Raw: ${rawText.substring(0, 100)}...`,
    )
  }
  return null
}

function mapShops(shopsArray: any[]): Shop[] {
  return shopsArray.map((shop: any) => transformShopData(shop))
}

function buildError(message: string): ShopsResponse {
  return { success: false, shops: [], total: 0, error: message }
}

// PAGINATED SHOPS API!
export async function fetchShops(params?: {
  status?: string
  city?: string
  search?: string
  page?: number
  limit?: number
  // optional sort inputs forwarded to buildQueryParams
  sort?: string
  order?: string
  shop_name?: string
}): Promise<ShopsResponse> {
  try {
    const queryParams = buildQueryParams(params)
    const apiUrl = buildApiUrl("/api/shops/get-shops")
    const urlWithParams = queryParams ? `${apiUrl}?${queryParams}` : apiUrl
    const headers = buildAuthHeaders()
    const response = await fetch(urlWithParams, { method: "GET", headers })
    const errorCheck = await validateResponse(response)
    if (errorCheck) return errorCheck
    const data = await response.json()
    if (response.status === 401) {
      return buildError("Unauthorized. Please log in again.")
    }
    if (response.ok && data) {
      const shops = mapShops(data.data || data.shops || [])
      return {
        success: true,
        shops,
        total: data.count || data.total || shops.length,
        page: data.page || data.pagination?.page || 1,
        limit: data.limit || data.pagination?.limit,
        totalPages: data.totalPages || data.pagination?.totalPages,
      }
    }
    return buildError(data.message || data.error || "Failed to fetch shops")
  } catch (error) {
    return buildError(error instanceof Error ? error.message : "Network error")
  }
}

// Fetch Unassigned Shops (always sends unassigned=true as string) - returns pagination fields
export async function fetchUnassignedShops(params?: {
  status?: string
  city?: string
  search?: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  shop_name?: string
}): Promise<ShopsResponse> {
  try {
    // Force unassigned=true to request unassigned shops from backend
    const mergedParams: Record<string, any> = {
      ...(params as Record<string, any>),
      unassigned: "true", // request unassigned shops
    }
    const queryParams = buildQueryParams(mergedParams)

    const apiUrl = buildApiUrl("/api/shops/get-shops")
    const urlWithParams = queryParams ? `${apiUrl}?${queryParams}` : apiUrl
    console.log("UnassignedShops API URL:", urlWithParams)

    const headers = buildAuthHeaders()
    const response = await fetch(urlWithParams, { method: "GET", headers })

    const errorCheck = await validateResponse(response)
    if (errorCheck) return errorCheck

    const data = await response.json()

    if (response.status === 401) {
      return buildError("Unauthorized. Please log in again.")
    }

    if (response.ok && data) {
      const shops = mapShops(data.data || data.shops || [])
      const total = data.count ?? data.total ?? shops.length
      const page = data.page ?? data.pagination?.page ?? (params?.page ?? 1)
      const limit = data.limit ?? data.pagination?.limit ?? params?.limit
      let totalPages = data.totalPages ?? data.pagination?.totalPages

      if (!totalPages) {
        if (limit && limit > 0) {
          totalPages = Math.max(1, Math.ceil(total / limit))
        } else {
          totalPages = 1
        }
      }

      return {
        success: true,
        shops,
        total,
        page,
        limit,
        totalPages,
      }
    }

    return buildError(data.message || data.error || "Failed to fetch unassigned shops")
  } catch (error) {
    return buildError(error instanceof Error ? error.message : "Network error")
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
    const queryParams = buildQueryParams(params as any)
    const apiUrl = buildApiUrl(`/api/users/get-assigned-shops-for-auditor/${auditorId}`)
    const urlWithParams = queryParams ? `${apiUrl}?${queryParams}` : apiUrl
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

      const shops: Shop[] = shopsArray.map((shop: any) => transformShopData(shop, auditorId))

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

      const processedShopData = transformShopData(rawShopData)

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

export async function assignShopsToUser(
  userId: string,
  shopIds: string[],
  role: string,
): Promise<{ success: boolean; message?: string; error?: string; alreadyAssigned?: string[] }> {
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
      body: JSON.stringify({ userId, shopIds, role }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const errorMessage =
        data.message ||
        data.error ||
        (response.status === 409
          ? "Shops already assigned to this user"
          : `Server error: ${response.status} ${response.statusText}`)

      return {
        success: false,
        error: errorMessage,
        alreadyAssigned: data.alreadyAssigned || [],
      }
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

export async function fetchVisitedShops(params?: {
  status?: string
  city?: string
  search?: string
  page?: number
  limit?: number
  shop_name?: string
}): Promise<ShopsResponse> {
  try {
    const queryParams = buildQueryParams(params as any)
    const apiUrl = buildApiUrl("/api/shops/get-visited-shops")
    const urlWithParams = queryParams ? `${apiUrl}?${queryParams}` : apiUrl
    console.log("Visited shops API URL:", urlWithParams)

    const headers = buildAuthHeaders()
    const response = await fetch(urlWithParams, { method: "GET", headers })

    const errorCheck = await validateResponse(response)
    if (errorCheck) return errorCheck

    const data = await response.json()

    if (response.status === 401) {
      return buildError("Unauthorized. Please log in again.")
    }

    if (response.ok && data) {
      // Handle different response structures for visited shops
      let shopsArray = []

      if (Array.isArray(data)) {
        shopsArray = data
      } else if (data.data && Array.isArray(data.data)) {
        shopsArray = data.data
      } else if (data.shops && Array.isArray(data.shops)) {
        shopsArray = data.shops
      } else if (data.visitedShops && Array.isArray(data.visitedShops)) {
        shopsArray = data.visitedShops
      } else {
        console.log("Unknown visited shops response structure:", Object.keys(data))
        shopsArray = []
      }

      const shops = mapShops(shopsArray)
      return { success: true, shops, total: data.count || data.total || shops.length }
    }

    return buildError(data.message || data.error || "Failed to fetch visited shops")
  } catch (error) {
    console.error("Error fetching visited shops:", error)
    return buildError(error instanceof Error ? error.message : "Network error")
  }
}

// rest of file unchanged...
export interface User {
  id: string
  name: string
  username: string
  password: string
  role: string
  address: string // user’s personal address
  location?: string
  createdAt: string
  shops?: Shop[] // ✅ linked shops
}
export interface UsersResponse {
  success: boolean
  users: User[]
  total: number
  error?: string
}

export interface ApiResponse {
  success: boolean
  user?: User
  message?: string
  error?: string
}

// ✅ make sure address is mapped from backend response
function transformUserData(user: any): User {
  return {
    id: user._id || user.id,
    name: user.name,
    username: user.username,
    password: user.password,
    role: user.role,
    address: user.address || "", // ✅ added
    location: user.location, // still optional
    createdAt: user.createdAt || new Date().toISOString(),
  }
}

// ...remaining functions unchanged (fetchUsers, registerUser, etc.)

export async function fetchUsers(): Promise<UsersResponse> {
  try {
    const apiUrl = buildApiUrl("/api/users/get-users")
    const headers = buildAuthHeaders()
    const response = await fetch(apiUrl, { method: "POST", headers })

    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      const rawText = await response.text()
      return { success: false, users: [], total: 0, error: rawText }
    }

    const data = await response.json()
    if (!response.ok) {
      return { success: false, users: [], total: 0, error: data.message || "Failed to fetch users" }
    }

    const usersArray = Array.isArray(data.data) ? data.data : data.users || []
    const users = usersArray.map((u: any) => transformUserData(u))

    return { success: true, users, total: data.count || users.length }
  } catch (err) {
    return { success: false, users: [], total: 0, error: err instanceof Error ? err.message : "Network error" }
  }
}

export async function registerUser(userData: {
  name: string
  username: string
  password: string
  role?: string // optional now
}): Promise<{ success: boolean; user?: User; message?: string; error?: string }> {
  try {
    const apiUrl = buildApiUrl("/api/users/register")
    const headers = buildAuthHeaders()

    // Use the role from the form, default to 'auditor' if not provided
    const payload = {
      ...userData,
      role: userData.role || "auditor",
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    let data: any = {}
    try {
      data = await response.json()
    } catch {
      // backend may not send JSON body
    }

    if (!response.ok) {
      return { success: false, error: data.message || data.error || "Failed to register user" }
    }

    const userDataResp = data.user || data.data
    return {
      success: true,
      user: userDataResp ? transformUserData(userDataResp) : undefined,
      message: data.message || "User created successfully",
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" }
  }
}



export async function fetchAllUsers(): Promise<UsersResponse> {
  try {
    const apiUrl = buildApiUrl("/api/users/get-all-users")
    const headers = buildAuthHeaders()

    const response = await fetch(apiUrl, { method: "GET", headers })

    const data = await response.json()
    if (!response.ok) {
      return { success: false, users: [], total: 0, error: data.message || data.error || "Failed to fetch users" }
    }

    const usersArray = Array.isArray(data.data) ? data.data : data.users || []
    const users = usersArray.map((u: any) => transformUserData(u))

    return { success: true, users, total: data.count || users.length }
  } catch (err) {
    return { success: false, users: [], total: 0, error: err instanceof Error ? err.message : "Network error" }
  }
}

export async function updateUser(
  id: string,
  userData: {
    name?: string
    username?: string
    role?: string
    password?: string
  },
): Promise<{ success: boolean; user?: User; message?: string; error?: string }> {
  try {
    const apiUrl = buildApiUrl(`/api/users/update-user/${id}`)
    const headers = buildAuthHeaders()

    const response = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(userData),
    })

    let data: any = {}
    try {
      data = await response.json()
    } catch {}

    if (!response.ok) {
      return { success: false, error: data.message || data.error || "Failed to update user" }
    }

    const updatedUser = data.user || data.data
    return {
      success: true,
      user: updatedUser ? transformUserData(updatedUser) : undefined,
      message: data.message || "User updated successfully",
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" }
  }
}
export async function fetchVisitStats(): Promise<{
  success: boolean
  visited?: number
  notVisited?: number
  total?: number
  error?: string
}> {
  try {
    const apiUrl = buildApiUrl("/api/shops/get-visit-stats")
    const headers = buildAuthHeaders()

    const response = await fetch(apiUrl, { method: "GET", headers })
    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to fetch visit stats" }
    }

    return {
      success: true,
      visited: data.visited,
      notVisited: data.notVisited,
      total: data.total,
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Network error" }
  }
}

export async function fetchInvalidGPSShops(): Promise<ShopsResponse> {
  try {
    const apiUrl = buildApiUrl("/api/shops/get-visited-shops")
    const headers = buildAuthHeaders()

    const response = await fetch(apiUrl, { method: "GET", headers })
    const data = await response.json()

    if (!response.ok) {
      return { success: false, shops: [], total: 0, error: data.message || "Failed to fetch visited shops" }
    }

    // Filter shops that have invalid GPS validation
    const invalidGPSShops = data.data.filter((shop: any) => {
      if (!shop.visitImages || shop.visitImages.length === 0) return false
      
      // Check if any visit has invalid GPS validation
      return shop.visitImages.some((visit: any) => 
        visit.gpsValidation && visit.gpsValidation.validationStatus === 'invalid'
      )
    })

    return { 
      success: true, 
      shops: invalidGPSShops.map(transformShopData), 
      total: invalidGPSShops.length 
    }
  } catch (error) {
    return { 
      success: false, 
      shops: [], 
      total: 0, 
      error: error instanceof Error ? error.message : "Network error" 
    }
  }
}

export async function saveGPSValidationResults(shopId: string, gpsValidationResults: any[]): Promise<{
  success: boolean
  message?: string
  updatedVisits?: number
  totalVisits?: number
  error?: string
}> {
  try {
    const apiUrl = buildApiUrl(`/api/shops/save-gps-validation/${shopId}`)
    const headers = buildAuthHeaders()

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ gpsValidationResults })
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to save GPS validation results" }
    }

    return {
      success: true,
      message: data.message,
      updatedVisits: data.updatedVisits,
      totalVisits: data.totalVisits
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Network error" 
    }
  }
}

export async function saveAIDetectionResults(shopId: string, aiDetectionResults: any[]): Promise<{
  success: boolean
  message?: string
  updatedVisits?: number
  totalVisits?: number
  error?: string
}> {
  try {
    const apiUrl = buildApiUrl(`/api/shops/save-ai-detection/${shopId}`)
    const headers = buildAuthHeaders()

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ aiDetectionResults })
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to save AI detection results" }
    }

    return {
      success: true,
      message: data.message,
      updatedVisits: data.updatedVisits,
      totalVisits: data.totalVisits
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Network error" 
    }
  }
}

export async function fetchPendingAndVisitedShops(userId: string): Promise<ShopsResponse> {
  try {
    // Put visit and userId in the query string
    const params = new URLSearchParams();
    params.append("visit", "false");
    params.append("userId", userId);

    const apiUrl = buildApiUrl("/api/shops/get-pending-and-visted-shops");
    const urlWithParams = `${apiUrl}?${params.toString()}`;

    const headers = buildAuthHeaders();
    const response = await fetch(urlWithParams, { method: "GET", headers });

    const errorCheck = await validateResponse(response);
    if (errorCheck) return errorCheck;

    const data = await response.json();

    if (response.status === 401) {
      return buildError("Unauthorized. Please log in again.");
    }

    if (response.ok && data) {
      let shopsArray: any[] = [];

      if (Array.isArray(data)) {
        shopsArray = data;
      } else if (Array.isArray(data.data)) {
        shopsArray = data.data;
      } else if (Array.isArray(data.shops)) {
        shopsArray = data.shops;
      } else {
        shopsArray = [];
      }

      const shops = mapShops(shopsArray);
      return { success: true, shops, total: data.count || data.total || shops.length };
    }

    return buildError(data.message || data.error || "Failed to fetch shops");
  } catch (error) {
    return buildError(error instanceof Error ? error.message : "Network error");
  }
}

// 🤖 AI Detection API
export interface AIDetectionResult {
  laysDetected: boolean
  laysCount: number
  confidence: number
  detectionMethod: 'logo' | 'text' | 'object' | 'none'
  logoDetections: Array<{
    description: string
    score: number
    boundingPoly?: {
      vertices: Array<{ x: number; y: number }>
    }
  }>
  extractedText: string
  detectedObjects: Array<{
    name: string
    score: number
  }>
  detectedLabels: Array<{
    description: string
    score: number
  }>
  processedAt: string
  error?: string
}

export interface AIDetectionResponse {
  success: boolean
  shopId?: string
  summary?: {
    totalVisits: number
    visitsWithAI: number
    totalLaysDetected: number
    averageConfidence: number
    detectionMethods: string[]
    lastDetection: string | null
  }
  results?: Array<{
    visitId: string
    shopImage: string
    shelfImage: string
    aiDetection: AIDetectionResult
    visitDate: string
  }>
  error?: string
}

export async function fetchAIDetectionResults(shopId: string): Promise<AIDetectionResponse> {
  try {
    const apiUrl = buildApiUrl(`/api/shops/ai-detection/${shopId}`)
    const headers = buildAuthHeaders()
    
    const response = await fetch(apiUrl, { method: "GET", headers })
    
    const errorCheck = await validateResponse(response)
    if (errorCheck) {
      return { success: false, error: errorCheck.error }
    }
    
    const data = await response.json()
    
    if (response.status === 401) {
      return { success: false, error: "Unauthorized. Please log in again." }
    }
    
    if (response.ok && data) {
      return {
        success: true,
        shopId: data.shopId,
        summary: data.summary,
        results: data.results
      }
    }
    
    return { success: false, error: data.message || data.error || "Failed to fetch AI detection results" }
  } catch (error) {
    console.error("Error fetching AI detection results:", error)
    return { success: false, error: error instanceof Error ? error.message : "Network error" }
  }
}

export async function updateShopsRadius(
  shopIds: string[], // always array
  thirtyMeterRadius: boolean
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = getSession()
    if (!session?.token) {
      return { success: false, error: "No authentication token found" }
    }

    const url = buildApiUrl("/api/shops/enable-radius")
    // Always send shopIds as array, thirtyMeterRadius as boolean
    const body = {
      shopIds, // array of strings
      thirtyMeterRadius // boolean
    }

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return { success: false, error: data.message || data.error || "Failed to update radius" }
    }
    // Pass through the response (including any booleans in data if your backend sends them)
    return { success: true, message: data.message || "Radius updated" }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}