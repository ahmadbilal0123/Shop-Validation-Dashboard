"use client"

import { useState } from "react"
import { ShopsList } from "@/components/shops-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Phone, Mail, Calendar, TrendingUp, ArrowLeft, ExternalLink } from "lucide-react"
import type { Shop } from "@/lib/api"
import { formatDate } from "@/lib/utils"

export default function ShopsPage() {
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)

  const handleShopSelect = (shop: Shop) => {
    setSelectedShop(shop)
  }

  const handleBackToList = () => {
    setSelectedShop(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getValidationScoreColor = (score?: number) => {
    if (!score) return "text-gray-500"
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  if (selectedShop) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shops
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{selectedShop.name}</h1>
            <p className="text-gray-600">Shop Details</p>
          </div>
        </div>

        {/* Shop Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status</span>
                <Badge className={getStatusColor(selectedShop.status)}>{selectedShop.status}</Badge>
              </div>

              <div>
                <span className="font-medium">Address</span>
                <div className="text-gray-600 mt-1">
                  <p>{selectedShop.address}</p>
                  <p>
                    {selectedShop.city}, {selectedShop.state} {selectedShop.zipCode}
                  </p>
                </div>
              </div>

              {selectedShop.phone && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Phone</span>
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {selectedShop.phone}
                  </div>
                </div>
              )}

              {selectedShop.email && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Email</span>
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {selectedShop.email}
                  </div>
                </div>
              )}

              {selectedShop.coordinates && (
                <div>
                  <span className="font-medium">Coordinates</span>
                  <div className="text-gray-600 mt-1">
                    <p>Lat: {selectedShop.coordinates.lat}</p>
                    <p>Lng: {selectedShop.coordinates.lng}</p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Map
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Visits</span>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  {selectedShop.visitCount}
                </div>
              </div>

              {selectedShop.validationScore && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Validation Score</span>
                  <div
                    className={`flex items-center font-medium ${getValidationScoreColor(selectedShop.validationScore)}`}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {selectedShop.validationScore}%
                  </div>
                </div>
              )}

              {selectedShop.lastVisit && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Last Visit</span>
                  <span className="text-gray-600">{formatDate(selectedShop.lastVisit)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="font-medium">Created</span>
                <span className="text-gray-600">{formatDate(selectedShop.createdAt)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Updated</span>
                <span className="text-gray-600">{formatDate(selectedShop.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return <ShopsList onShopSelect={handleShopSelect} />
}
