"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import LeafletMap from "./LeafletMap"

export default function CreateShopPage() {
  const router = useRouter()
  const [shopName, setShopName] = useState("")
  const [shopAddress, setShopAddress] = useState("")
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [geoLoading, setGeoLoading] = useState(true)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

  // Get user's current location on mount
  useEffect(() => {
    setGeoLoading(true)
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGps({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          })
          setGeoLoading(false)
        },
        (err) => {
          setError("Could not get your current location. Please allow location access.")
          setGeoLoading(false)
        }
      )
    } else {
      setError("Geolocation is not supported by your browser.")
      setGeoLoading(false)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!shopName || !shopAddress || !gps) {
      setError("All fields are required!")
      return
    }
    setLoading(true)

    const payload = {
      shop_name: shopName,
      shop_address: shopAddress,
      gps_e: gps.lng,
      gps_n: gps.lat,
    }

    let token: string | null = null
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("session")
      if (session) {
        try {
          token = JSON.parse(session).token
        } catch (e) {
          token = null
        }
      }
    }

    if (!token) {
      setError("No token found. Please login again.")
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/shops/add-shop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        router.push("/dashboard/shops")
      } else {
        const errorData = await res.json().catch(() => ({}))
        setError(errorData?.message || "Failed to create shop")
      }
    } catch (error) {
      setError("An error occurred while creating the shop.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 py-8">
      <Card className="w-full max-w-2xl shadow-2xl border-blue-100 bg-white/80 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-indigo-700">Create New Shop</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Shop Name</label>
              <Input
                placeholder="Enter shop name"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Shop Address</label>
              <Input
                placeholder="Enter shop address"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Your Current Location</label>
              <div className="rounded-lg overflow-hidden border border-blue-200 h-72">
                <LeafletMap
                  lat={gps?.lat || 31.5204}
                  lng={gps?.lng || 74.3587}
                  markers={gps ? [{ lat: gps.lat, lng: gps.lng, label: "Your Location" }] : []}
                  // Remove onMapClick to disable map click
                  onMapClick={undefined}
                  // (If needed, you can adjust LeafletMap to not be interactive)
                />
              </div>
              <div className="mt-2 text-sm text-slate-700">
                {geoLoading ? (
                  <span className="italic text-slate-400">Getting your location...</span>
                ) : gps ? (
                  <>
                    <span className="font-medium">Your Coordinates:</span>
                    <span className="ml-2">Longitude (E): {gps.lng.toFixed(6)}</span>
                    <span className="ml-2">Latitude (N): {gps.lat.toFixed(6)}</span>
                  </>
                ) : (
                  <span className="italic text-slate-400">No location available.</span>
                )}
              </div>
            </div>
            {error && (
              <div className="text-red-600 text-sm font-semibold">{error}</div>
            )}
            <div className="pt-4 flex gap-2 justify-end">
              <Button type="button" variant="outline" className="border-slate-300" onClick={() => router.push("/dashboard/shops")} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={!shopName || !shopAddress || !gps || loading || geoLoading}>
                {loading ? "Creating..." : "Create Shop"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}