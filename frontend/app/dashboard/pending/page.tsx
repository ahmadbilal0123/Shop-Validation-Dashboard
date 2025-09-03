"use client"

import React, { useEffect, useState } from "react"
import { fetchPendingAndVisitedShops, Shop } from "@/lib/api" // adjust import path if needed

const PendingShopsPage: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    async function loadPendingShops() {
      setLoading(true)
      setError("")
      // pending=false, visited=true
      const res = await fetchPendingAndVisitedShops({ pending: false, visited: true })
      if (res.success) {
        setShops(res.shops)
      } else {
        setError(res.error || "Failed to load pending shops")
      }
      setLoading(false)
    }
    loadPendingShops()
  }, [])

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Pending Shops</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
      {!loading && shops.length === 0 && !error && (
        <p style={{ textAlign: "center" }}>No pending shops found.</p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {shops.map(shop => (
          <div
            key={shop.id}
            style={{
              border: "1px solid #eee",
              borderRadius: 8,
              padding: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              background: "#fff"
            }}
          >
            <h3 style={{ margin: "0 0 8px 0" }}>{shop.name}</h3>
            <div style={{ fontSize: "0.95em", marginBottom: 6 }}>
              <strong>Status:</strong> <span style={{ color: shop.status === "pending" ? "#f39c12" : "#2ecc40" }}>{shop.status}</span>
            </div>
            <div style={{ marginBottom: 6 }}>
              <strong>Address:</strong> {shop.address}
            </div>
            <div style={{ marginBottom: 6 }}>
              <strong>City:</strong> {shop.city}
            </div>
            <div style={{ marginBottom: 6 }}>
              <strong>State:</strong> {shop.state}
            </div>
            <div style={{ marginBottom: 6 }}>
              <strong>Zip Code:</strong> {shop.zipCode}
            </div>
            {shop.phone && (
              <div style={{ marginBottom: 6 }}>
                <strong>Phone:</strong> {shop.phone}
              </div>
            )}
            <div style={{ marginBottom: 6 }}>
              <strong>Visit Count:</strong> {shop.visitCount}
            </div>
            {shop.lastVisit && (
              <div>
                <strong>Last Visit:</strong> {new Date(shop.lastVisit).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default PendingShopsPage