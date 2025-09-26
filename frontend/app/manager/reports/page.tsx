"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { List, CheckCircle2, Clock, Filter, RefreshCw } from "lucide-react"
import { ManagerSidebar } from "@/components/manager-sidebar"
import { fetchAssignedShopsForAuditor } from "@/lib/api"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"

// Fields to hide from the table
const HIDDEN_KEYS = [
  "__v",
  "createdAt",
  "updatedAt",
  "assignedTo",
  "visitedAt",
  "visitedBy",
  "assignedManagerId",
  "assignedSalesperson",
  "assignedQc",
  "id",
  "_id",
  "updateData",
]

// Map user ID fields to their corresponding name fields
const USER_FIELDS_MAP: { [key: string]: string } = {
  assignedTo: "assignedToName",
  visitedBy: "visitedByName",
  assignedSalesperson: "assignedSalespersonName",
  assignedQc: "assignedQcName",
  assignedManagerId: "assignedManagerName",
}

// Likely key maps for filters
const NAME_KEYS = ["shopName", "name", "shop_name", "storeName", "store_name"]
const ADDRESS_KEYS = ["address", "shopAddress", "shop_address", "location", "street"]
const DISTRICT_KEYS = ["district", "districtName", "district_name", "area", "region", "city"]

function getAllKeys(shops: any[]): string[] {
  const keys: string[] = []
  shops.forEach((shop) => {
    Object.keys(shop)
      .filter((k) => !HIDDEN_KEYS.includes(k))
      .forEach((k) => {
        if (!keys.includes(k)) keys.push(k)
      })
  })

  // Add user name fields if present and remove their raw ID columns
  Object.entries(USER_FIELDS_MAP).forEach(([id, name]) => {
    const idx = keys.indexOf(id)
    if (idx !== -1) {
      keys.splice(idx, 1, name)
    } else if (name && !keys.includes(name)) {
      if (shops.some((shop) => shop[name])) {
        keys.push(name)
      }
    }
  })

  return keys
}

// Helper: get user name, fallback to "-" if not found
function getUserName(field: any): string {
  if (!field) return "-"
  if (typeof field === "string") return field
  return field.name || field.fullName || field.username || "-"
}

function textFromKeys(row: any, keys: string[]) {
  for (const k of keys) {
    const v = row?.[k]
    if (v !== undefined && v !== null && v !== "") {
      return typeof v === "object" ? getUserName(v) : String(v)
    }
  }
  return ""
}

function renderCellValue(key: string, value: any, row?: any) {
  // For all user-name fields, show the name, not the ID
  const userNameKeys = Object.values(USER_FIELDS_MAP)
  if (userNameKeys.includes(key)) {
    return <span>{row?.[key] || getUserName(value) || "-"}</span>
  }

  // Show only images for visitImages, not lat/lng/time etc
  if (key === "visitImages" && Array.isArray(value)) {
    return (
      <div className="flex flex-col gap-2 max-w-xs">
        {value.map((v, idx) => (
          <div key={idx} style={{ marginBottom: 12 }}>
            <div className="flex flex-row gap-2 mb-1">
              {v.shopImage && (
                <a href={v.shopImage} target="_blank" rel="noopener noreferrer">
                  <img
                    src={v.shopImage || "/placeholder.svg?height=96&width=160&query=shop%20image"}
                    alt="Shop"
                    className="h-12 w-20 rounded-md shadow-sm border object-cover hover:shadow-md transition-shadow"
                  />
                </a>
              )}
              {v.shelfImage && (
                <a href={v.shelfImage} target="_blank" rel="noopener noreferrer">
                  <img
                    src={v.shelfImage || "/placeholder.svg?height=96&width=160&query=shelf%20image"}
                    alt="Shelf"
                    className="h-12 w-20 rounded-md shadow-sm border object-cover hover:shadow-md transition-shadow"
                  />
                </a>
              )}
            </div>
          </div>
        ))}
        <Badge variant="secondary" className="text-xs w-fit">
          {value.length} image(s)
        </Badge>
      </div>
    )
  }

  // For arrays of users, show names
  if (
    Array.isArray(value) &&
    value.length &&
    typeof value[0] === "object" &&
    (value[0].name || value[0].fullName || value[0].username)
  ) {
    return value.map((u) => getUserName(u)).join(", ")
  }

  // date formatting for fields not hidden
  if (key.toLowerCase().includes("date") || key.toLowerCase().includes("at")) {
    if (typeof value === "string" && !isNaN(Date.parse(value)))
      return <span className="break-words whitespace-pre-line">{new Date(value).toLocaleString()}</span>
    if (typeof value === "number" && value > 100000)
      return <span className="break-words whitespace-pre-line">{value}</span>
  }
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-col gap-1">
        {value.map((item, idx) => (
          <div
            key={idx}
            className="text-xs text-muted-foreground font-mono break-words whitespace-pre-line border-b last:border-b-0 border-border py-0.5"
          >
            {typeof item === "object"
              ? JSON.stringify(Object.fromEntries(Object.entries(item).filter(([k]) => k !== "id" && k !== "_id")))
              : String(item)}
          </div>
        ))}
      </div>
    )
  }
  if (typeof value === "boolean") {
    return value ? (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
        Yes
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
        No
      </Badge>
    )
  }
  if (typeof value === "object" && value !== null) {
    // Hide id/_id keys in nested objects
    return (
      <div className="flex flex-col gap-1">
        {Object.entries(value)
          .filter(([k]) => k !== "id" && k !== "_id")
          .map(([k, v], idx) => (
            <div
              key={idx}
              className="text-xs text-muted-foreground font-mono break-words whitespace-pre-line border-b last:border-b-0"
            >
              <span className="font-semibold">{k}: </span>
              {typeof v === "object"
                ? JSON.stringify(
                    Object.fromEntries(Object.entries(v ?? {}).filter(([kk]) => kk !== "id" && kk !== "_id")),
                  )
                : String(v)}
            </div>
          ))}
      </div>
    )
  }
  if (value === undefined || value === null || value === "") return <span className="text-muted-foreground">-</span>
  return <span className="break-words whitespace-pre-line">{String(value)}</span>
}

export default function ReportsPage() {
  const [auditorId, setAuditorId] = useState<string>("")
  const [shops, setShops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ name: "__all__", address: "__all__", district: "__all__" })
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    if (!auditorId && typeof window !== "undefined") {
      const session = localStorage.getItem("session")
      if (session) {
        try {
          const parsed = JSON.parse(session)
          setAuditorId(parsed?.user?.id || parsed?.auditorId || "")
        } catch {}
      }
    }
  }, [auditorId])

  useEffect(() => {
    if (!auditorId) return
    setLoading(true)
    setError(null)
    fetchAssignedShopsForAuditor(auditorId)
      .then((res) => {
        if (res.success) {
          setShops(res.shops)
          setTotal(res.total || res.shops.length)
        } else {
          setError(res.error || "Failed to fetch assigned shops.")
        }
      })
      .catch((e) => setError(typeof e === "string" ? e : "Network error"))
      .finally(() => setLoading(false))
  }, [auditorId])

  // KPI Metrics
  const totalShops = shops.length
  const visitedShops = useMemo(
    () =>
      shops.filter((shop) => shop.visit === true || (Array.isArray(shop.visitImages) && shop.visitImages.length > 0))
        .length,
    [shops],
  )
  const assignedShops = useMemo(() => shops.filter((shop) => shop.assignedTo).length, [shops])
  const columns = shops.length ? getAllKeys(shops) : []

  const nameKey = useMemo(() => NAME_KEYS.find((k) => columns.includes(k)), [columns])
  const addressKey = useMemo(() => ADDRESS_KEYS.find((k) => columns.includes(k)), [columns])
  const districtKey = useMemo(() => DISTRICT_KEYS.find((k) => columns.includes(k)), [columns])

  const nameOptions = useMemo(() => {
    const s = new Set<string>()
    shops.forEach((row) => {
      const raw = nameKey ? row?.[nameKey] : textFromKeys(row, NAME_KEYS)
      const v = String(raw ?? "").trim()
      if (v) s.add(v)
    })
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [shops, nameKey])

  const addressOptions = useMemo(() => {
    const s = new Set<string>()
    shops.forEach((row) => {
      const raw = addressKey ? row?.[addressKey] : textFromKeys(row, ADDRESS_KEYS)
      const v = String(raw ?? "").trim()
      if (v) s.add(v)
    })
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [shops, addressKey])

  const districtOptions = useMemo(() => {
    const s = new Set<string>()
    shops.forEach((row) => {
      const raw = districtKey ? row?.[districtKey] : textFromKeys(row, DISTRICT_KEYS)
      const v = String(raw ?? "").trim()
      if (v) s.add(v)
    })
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [shops, districtKey])

  const filteredShops = useMemo(() => {
    const nameSel = (filters.name || "").toLowerCase()
    const addrSel = (filters.address || "").toLowerCase()
    const distSel = (filters.district || "").toLowerCase()

    const nameAll = nameSel === "__all__"
    const addrAll = addrSel === "__all__"
    const distAll = distSel === "__all__"

    return shops.filter((row) => {
      const nameText = textFromKeys(row, NAME_KEYS).toLowerCase()
      const addrText = textFromKeys(row, ADDRESS_KEYS).toLowerCase()
      const distText = textFromKeys(row, DISTRICT_KEYS).toLowerCase()

      const nameOk = nameAll || nameText === nameSel
      const addrOk = addrAll || addrText === addrSel
      const distOk = distAll || distText === distSel
      return nameOk && addrOk && distOk
    })
  }, [shops, filters])

  const activeFilterKeys = useMemo(() => {
    const keys = new Set<string>()
    if (filters.name !== "__all__" && nameKey) keys.add(nameKey)
    if (filters.address !== "__all__" && addressKey) keys.add(addressKey)
    if (filters.district !== "__all__" && districtKey) keys.add(districtKey)
    return Array.from(keys)
  }, [filters, nameKey, addressKey, districtKey])

  const visibleColumns = useMemo(() => {
    if (!activeFilterKeys.length) return columns
    const subset = columns.filter((col) => activeFilterKeys.includes(col))
    return subset.length ? subset : columns
  }, [columns, activeFilterKeys])

  const KPICard = ({
    title,
    value,
    subtext,
    icon,
    variant = "default",
  }: {
    title: string
    value: string | number
    subtext: string
    icon: React.ReactNode
    variant?: "default" | "primary" | "success" | "warning"
  }) => {
    const variantStyles = {
      default: "border-border bg-card hover:bg-accent/50",
      primary: "border-primary/20 bg-primary/5 hover:bg-primary/10",
      success: "border-green-200 bg-green-50 hover:bg-green-100",
      warning: "border-orange-200 bg-orange-50 hover:bg-orange-100",
    }

    return (
      <Card className={`transition-all duration-200 hover:shadow-md ${variantStyles[variant]}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              <p className="text-xs text-muted-foreground">{subtext}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">{icon}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <ManagerSidebar />
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <KPICard
                title="Total Shops"
                value={totalShops}
                subtext="All registered shops"
                icon={<List className="h-6 w-6 text-muted-foreground" />}
                variant="default"
              />
              <KPICard
                title="Visited Shops"
                value={visitedShops}
                subtext="Successfully visited"
                icon={<CheckCircle2 className="h-6 w-6 text-muted-foreground" />}
                variant="default"
              />
              <KPICard
                title="Assigned Shops"
                value={assignedShops}
                subtext="Assigned to auditors"
                icon={<Clock className="h-6 w-6 text-muted-foreground" />}
                variant="default"
              />
            </div>

            <Card className="flex-1">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold">Manager Reports</CardTitle>
                    <p className="text-muted-foreground mt-1">Assigned shops overview and details</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-fit">
                      Total: {total} shops
                    </Badge>
                    <Badge variant="secondary" className="w-fit">
                      Showing: {filteredShops.length}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters toolbar */}
                <div className="rounded-md border p-3 bg-card/50">
                  <div className="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Filter className="h-4 w-4" />
                      <span className="text-sm font-medium">Filters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={compact ? "default" : "outline"}
                        onClick={() => setCompact((v) => !v)}
                        className="h-9"
                      >
                        {compact ? "Compact view" : "Comfortable view"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFilters({ name: "__all__", address: "__all__", district: "__all__" })}
                        className="h-9"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>

                  {/* Switch Shop Name and Address to Select dropdowns like District */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-2">
                    <div className="md:col-span-4">
                      <Select value={filters.name} onValueChange={(v) => setFilters((f) => ({ ...f, name: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="All shop names" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All shop names</SelectItem>
                          {nameOptions.map((opt) => (
                            <SelectItem key={opt} value={opt.toLowerCase()}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-5">
                      <Select value={filters.address} onValueChange={(v) => setFilters((f) => ({ ...f, address: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="All addresses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All addresses</SelectItem>
                          {addressOptions.map((opt) => (
                            <SelectItem key={opt} value={opt.toLowerCase()}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-3">
                      <Select
                        value={filters.district}
                        onValueChange={(v) => setFilters((f) => ({ ...f, district: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All districts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All districts</SelectItem>
                          {districtOptions.map((opt) => (
                            <SelectItem key={opt} value={opt.toLowerCase()}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                  <div className="max-h-[65vh] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-card">
                        <TableRow className="border-b border-border">
                          {/* Use all columns instead of restricted displayColumns */}
                          {visibleColumns.map((col) => (
                            <TableHead
                              key={col}
                              className="font-semibold whitespace-nowrap min-w-[160px] border-r border-border last:border-r-0 bg-muted"
                            >
                              {col.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Render all columns for each filtered row */}
                        {filteredShops.map((shop, idx) => (
                          <TableRow
                            key={idx}
                            className="odd:bg-background even:bg-muted/30 hover:bg-muted/50 border-b border-border last:border-b-0"
                          >
                            {visibleColumns.map((col) => (
                              <TableCell
                                key={col}
                                className={`${compact ? "p-2" : "p-4"} max-w-[260px] min-w-[160px] border-r border-border last:border-r-0 align-top`}
                                style={{ wordBreak: "break-word", whiteSpace: "pre-line" }}
                              >
                                {renderCellValue(col, shop[col], shop)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
