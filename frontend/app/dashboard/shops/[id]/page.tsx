"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchShopById, fetchAllUsers, fetchAIDetectionResults, saveGPSValidationResults, saveAIDetectionResults, type AIDetectionResponse } from "@/lib/api"
import { getSession } from "@/lib/auth"

// GPS Validation Utility Functions
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return Math.round(distance * 100) / 100 // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// AI Detection Utility Functions
function analyzeImageForLaysFrontend(imageUrl: string): Promise<any> {
  return new Promise((resolve) => {
    // Simulate AI detection analysis for frontend
    // In a real implementation, this would call a frontend AI service or API
    console.log('🤖 Frontend AI analysis for image:', imageUrl);
    
    // Simulate detection results based on image URL patterns
    const laysKeywords = ['lays', 'lay\'s', 'lays classic', 'lays masala', 'lays magic masala'];
    const imageName = imageUrl.toLowerCase();
    
    // Simple keyword matching simulation
    const laysDetected = laysKeywords.some(keyword => imageName.includes(keyword));
    const laysCount = laysDetected ? Math.floor(Math.random() * 3) + 1 : 0;
    const confidence = laysDetected ? Math.random() * 0.4 + 0.6 : 0; // 60-100% if detected
    
    const result = {
      laysDetected,
      laysCount,
      confidence: Math.round(confidence * 100) / 100,
      detectionMethod: laysDetected ? 'simulated' : 'none',
      logoDetections: laysDetected ? [{ description: 'Lay\'s Logo', score: confidence }] : [],
      extractedText: laysDetected ? 'Lay\'s products detected' : '',
      detectedObjects: laysDetected ? [{ name: 'chip bag', score: confidence }] : [],
      detectedLabels: laysDetected ? [{ description: 'snack food', score: confidence }] : [],
      processedAt: new Date()
    };
    
    console.log('🎯 Frontend AI detection result:', result);
    resolve(result);
  });
}

function validateVisitAIDetection(visit: any): any {
  try {
    // Check if visit has shelf image
    if (!visit.shelfImage) {
      return {
        laysDetected: false,
        laysCount: 0,
        confidence: 0,
        detectionMethod: 'none',
        logoDetections: [],
        extractedText: '',
        detectedObjects: [],
        detectedLabels: [],
        processedAt: new Date(),
        error: 'No shelf image available'
      };
    }

    // For now, return a placeholder that will be replaced by actual AI detection
    // In a real implementation, this would call the AI detection service
    return {
      laysDetected: false, // Will be updated by actual AI detection
      laysCount: 0,
      confidence: 0,
      detectionMethod: 'pending',
      logoDetections: [],
      extractedText: '',
      detectedObjects: [],
      detectedLabels: [],
      processedAt: new Date(),
      needsProcessing: true
    };
  } catch (error) {
    console.error('Error in AI detection validation:', error);
    return {
      laysDetected: false,
      laysCount: 0,
      confidence: 0,
      detectionMethod: 'none',
      logoDetections: [],
      extractedText: '',
      detectedObjects: [],
      detectedLabels: [],
      processedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function validateVisitGPS(visitLocation: any, shopCoordinates: { gps_n: number; gps_e: number }, radiusThreshold = 30) {
  try {
    // Check if shop coordinates are available
    if (!shopCoordinates || shopCoordinates.gps_n === undefined || shopCoordinates.gps_n === null || shopCoordinates.gps_e === undefined || shopCoordinates.gps_e === null) {
      return {
        isValid: false,
        validationStatus: 'no_data',
        error: 'Shop coordinates not available',
        shopCoordinates: null,
        startAuditDistance: null,
        photoClickDistance: null,
        validationDetails: {
          startAuditValid: false,
          photoClickValid: false
        },
        radiusThreshold,
        validatedAt: new Date()
      }
    }

    const shopLat = shopCoordinates.gps_n
    const shopLon = shopCoordinates.gps_e
    
    // Initialize validation result
    const validationResult = {
      shopCoordinates: {
        latitude: shopLat,
        longitude: shopLon
      },
      radiusThreshold,
      validatedAt: new Date()
    }

    // Validate Start Audit location
    let startAuditDistance = null
    let startAuditValid = false
    
    if (visitLocation.startAudit && 
        visitLocation.startAudit !== null &&
        visitLocation.startAudit.latitude !== null && 
        visitLocation.startAudit.latitude !== undefined &&
        visitLocation.startAudit.longitude !== null && 
        visitLocation.startAudit.longitude !== undefined) {
      startAuditDistance = calculateDistance(
        shopLat, 
        shopLon, 
        visitLocation.startAudit.latitude, 
        visitLocation.startAudit.longitude
      )
      startAuditValid = startAuditDistance <= radiusThreshold
    }

    // Validate Photo Click location
    let photoClickDistance = null
    let photoClickValid = false
    
    if (visitLocation.photoClick && 
        visitLocation.photoClick !== null &&
        visitLocation.photoClick.latitude !== null && 
        visitLocation.photoClick.latitude !== undefined &&
        visitLocation.photoClick.longitude !== null && 
        visitLocation.photoClick.longitude !== undefined) {
      photoClickDistance = calculateDistance(
        shopLat, 
        shopLon, 
        visitLocation.photoClick.latitude, 
        visitLocation.photoClick.longitude
      )
      photoClickValid = photoClickDistance <= radiusThreshold
    }

    // Determine overall validation status (only using Start Audit and Photo Click)
    const validCount = [startAuditValid, photoClickValid].filter(Boolean).length
    const totalCount = [startAuditDistance, photoClickDistance].filter(d => d !== null).length
    
    let validationStatus = 'no_data'
    let isValid = false

    if (totalCount === 0) {
      validationStatus = 'no_data'
    } else if (validCount === totalCount && validCount > 0) {
      validationStatus = 'valid'
      isValid = true
    } else if (validCount === 0) {
      validationStatus = 'invalid'
    } else {
      validationStatus = 'partial'
      isValid = validCount >= 1 // Consider valid if at least 1 out of 2 are valid
    }

    // Build final result
    const finalResult = {
      isValid,
      validationStatus,
      startAuditDistance,
      photoClickDistance,
      validationDetails: {
        startAuditValid,
        photoClickValid
      },
      ...validationResult
    }

    return finalResult

  } catch (error) {
    console.error('Error in GPS validation:', error)
      return {
        isValid: false,
        validationStatus: 'no_data',
        error: error instanceof Error ? error.message : 'Unknown error',
        shopCoordinates: null,
        startAuditDistance: null,
        photoClickDistance: null,
        validationDetails: {
          startAuditValid: false,
          photoClickValid: false
        },
        radiusThreshold,
        validatedAt: new Date()
      }
  }
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, MapPin, Phone, Star, ImageIcon, History, User, UserCheck, Brain, CheckCircle, XCircle, Eye, Navigation, MapPin as MapPinIcon } from "lucide-react"
import MapDynamic from "@/components/MapDynamic"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface ShopData {
  [key: string]: any
}

// ZoomableImage component for modal image zoom
function ZoomableImage({ src }: { src: string }) {
  const [zoomed, setZoomed] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const handleDoubleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    setZoomed(z => !z)
    if (!zoomed) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setPosition({ x, y })
    } else {
      setPosition({ x: 0, y: 0 })
    }
  }

  return (
    <img
      src={src}
      alt="Zoomed"
      className={`rounded-2xl shadow-2xl border-4 border-white transition-transform duration-300 cursor-zoom-in ${zoomed ? 'cursor-zoom-out' : ''}`}
      style={
        zoomed
          ? {
              transform: `scale(2) translate(${-position.x}px, ${-position.y}px)`,
              maxWidth: 'none',
              maxHeight: 'none',
            }
          : {
              width: '900px',
              height: 'auto',
              maxHeight: '85vh',
              objectFit: 'cover',
              display: 'block'
            }
      }
      onDoubleClick={handleDoubleClick}
    />
  )
}

export default function ShopDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const shopId = params.id as string

  const [shop, setShop] = useState<ShopData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPreviousImages, setShowPreviousImages] = useState(false)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const [allImages, setAllImages] = useState<string[]>([])
  const [assignedUser, setAssignedUser] = useState<{ name: string; role: string } | null>(null)
  const [assignedQC, setAssignedQC] = useState<{ name: string; role: string } | null>(null)
  const [visitedByUser, setVisitedByUser] = useState<{ name: string; role: string } | null>(null)
  const [aiDetectionData, setAiDetectionData] = useState<AIDetectionResponse | null>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [calculatedGPSValidation, setCalculatedGPSValidation] = useState<any[]>([])
  const [savingGPSValidation, setSavingGPSValidation] = useState(false)
  const [calculatedAIDetection, setCalculatedAIDetection] = useState<any[]>([])
  const [savingAIDetection, setSavingAIDetection] = useState(false)

  // Function to fetch assigned user details
  const fetchAssignedUser = async (userId: string) => {
    try {
      console.log("fetchAssignedUser called with userId:", userId)
      
      // Use the same approach as users page
      const usersResponse = await fetchAllUsers()
      if (usersResponse.success) {
        console.log("Users fetched successfully:", usersResponse.users)
        const user = usersResponse.users.find((u: any) => u.id === userId)
        console.log("Found user:", user)
        if (user) {
          setAssignedUser({ name: user.name, role: user.role })
          console.log("Set assigned user:", { name: user.name, role: user.role })
        } else {
          console.log("User not found with ID:", userId)
        }
      } else {
        console.error("Failed to fetch users:", usersResponse.error)
      }
    } catch (error) {
      console.error("Error fetching assigned user:", error)
    }
  }

  // Function to fetch assigned QC details
  const fetchAssignedQC = async (userId: string) => {
    try {
      console.log("fetchAssignedQC called with userId:", userId)
      
      // Use the same approach as users page
      const usersResponse = await fetchAllUsers()
      if (usersResponse.success) {
        console.log("QC Users fetched successfully:", usersResponse.users)
        const user = usersResponse.users.find((u: any) => u.id === userId)
        console.log("Found QC user:", user)
        if (user) {
          setAssignedQC({ name: user.name, role: user.role })
          console.log("Set assigned QC:", { name: user.name, role: user.role })
        } else {
          console.log("QC User not found with ID:", userId)
        }
      } else {
        console.error("Failed to fetch QC users:", usersResponse.error)
      }
    } catch (error) {
      console.error("Error fetching assigned QC:", error)
    }
  }

  // Function to fetch visitedBy user details
  const fetchVisitedByUser = async (userId: string) => {
    try {
      console.log("fetchVisitedByUser called with userId:", userId)
      
      const usersResponse = await fetchAllUsers()
      if (usersResponse.success) {
        console.log("VisitedBy Users fetched successfully:", usersResponse.users)
        const user = usersResponse.users.find((u: any) => u.id === userId)
        console.log("Found visitedBy user:", user)
        if (user) {
          setVisitedByUser({ name: user.name, role: user.role })
          console.log("Set visitedBy user:", { name: user.name, role: user.role })
        } else {
          console.log("VisitedBy User not found with ID:", userId)
        }
      } else {
        console.error("Failed to fetch visitedBy users:", usersResponse.error)
      }
    } catch (error) {
      console.error("Error fetching visitedBy user:", error)
    }
  }

  // Function to load AI detection data
  const loadAIDetectionData = async () => {
    if (!shopId) return
    
    setLoadingAI(true)
    try {
      const result = await fetchAIDetectionResults(shopId)
      if (result.success) {
        setAiDetectionData(result)
      }
    } catch (error) {
      console.error('Error loading AI detection data:', error)
    } finally {
      setLoadingAI(false)
    }
  }

  // Function to calculate GPS validation for all visits
  const calculateGPSValidationForAllVisits = async () => {
    if (!shop || !shop.visitImages) return

    const shopCoordinates = {
      gps_n: shop.gps_n,
      gps_e: shop.gps_e
    }

    const calculatedValidations = shop.visitImages.map((visit: any) => {
      const validation = validateVisitGPS(visit.visitLocation, shopCoordinates, 30)
      return {
        ...visit,
        calculatedGPSValidation: validation
      }
    })

    setCalculatedGPSValidation(calculatedValidations)
    console.log('🔍 Calculated GPS Validations:', calculatedValidations)

    // Save GPS validation results to database
    await saveGPSValidationToDatabase(calculatedValidations)
  }

  // Function to save GPS validation results to database
  const saveGPSValidationToDatabase = async (gpsValidationResults: any[]) => {
    if (!shopId || !gpsValidationResults.length) return

    setSavingGPSValidation(true)
    try {
      console.log('💾 Saving GPS validation results to database...')
      const response = await saveGPSValidationResults(shopId, gpsValidationResults)
      
      if (response.success) {
        console.log('✅ GPS validation results saved successfully:', {
          updatedVisits: response.updatedVisits,
          totalVisits: response.totalVisits
        })
      } else {
        console.error('❌ Failed to save GPS validation results:', response.error)
      }
    } catch (error) {
      console.error('❌ Error saving GPS validation results:', error)
    } finally {
      setSavingGPSValidation(false)
    }
  }

  // Function to calculate AI detection for all visits
  const calculateAIDetectionForAllVisits = async () => {
    if (!shop || !shop.visitImages) return

    console.log('🤖 Starting AI detection calculation for all visits...')
    
    const calculatedDetections = []
    
    for (let i = 0; i < shop.visitImages.length; i++) {
      const visit = shop.visitImages[i]
      console.log(`🔍 Processing visit ${i + 1}/${shop.visitImages.length}`)
      
      // Check if visit already has AI detection data
      if (visit.aiDetection && visit.aiDetection.laysDetected !== undefined) {
        console.log(`✅ Visit ${i + 1} already has AI detection data`)
        calculatedDetections.push({
          ...visit,
          calculatedAIDetection: visit.aiDetection
        })
        continue
      }
      
      // Perform AI detection for this visit
      const aiDetection = await analyzeImageForLaysFrontend(visit.shelfImage)
      calculatedDetections.push({
        ...visit,
        calculatedAIDetection: aiDetection
      })
      
      console.log(`🎯 AI detection completed for visit ${i + 1}:`, {
        laysDetected: aiDetection.laysDetected,
        laysCount: aiDetection.laysCount,
        confidence: aiDetection.confidence
      })
    }

    setCalculatedAIDetection(calculatedDetections)
    console.log('🔍 Calculated AI Detections:', calculatedDetections)

    // Save AI detection results to database
    await saveAIDetectionToDatabase(calculatedDetections)
  }

  // Function to save AI detection results to database
  const saveAIDetectionToDatabase = async (aiDetectionResults: any[]) => {
    if (!shopId || !aiDetectionResults.length) return

    setSavingAIDetection(true)
    try {
      console.log('💾 Saving AI detection results to database...')
      const response = await saveAIDetectionResults(shopId, aiDetectionResults)
      
      if (response.success) {
        console.log('✅ AI detection results saved successfully:', {
          updatedVisits: response.updatedVisits,
          totalVisits: response.totalVisits
        })
      } else {
        console.error('❌ Failed to save AI detection results:', response.error)
      }
    } catch (error) {
      console.error('❌ Error saving AI detection results:', error)
    } finally {
      setSavingAIDetection(false)
    }
  }

  useEffect(() => {
    const loadShopData = async () => {
      if (!shopId) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetchShopById(shopId)

        if (response.success && response.data) {
          setShop(response.data)
          console.log("Shop data loaded:", response.data)
          console.log("assignedTo:", response.data.assignedTo)
          console.log("assignedQc:", response.data.assignedQc)
          
          // Fetch assigned user details if shop is assigned
          if (response.data.assignedTo) {
            console.log("Fetching auditor for ID:", response.data.assignedTo)
            await fetchAssignedUser(response.data.assignedTo)
          }
          
          // Fetch assigned QC details if shop has QC assigned
          if (response.data.assignedQc) {
            console.log("Fetching QC for ID:", response.data.assignedQc)
            await fetchAssignedQC(response.data.assignedQc)
          }
          
          // Fetch visitedBy user details if shop has been visited
          if (response.data.visitedBy) {
            console.log("Fetching visitedBy user for ID:", response.data.visitedBy)
            await fetchVisitedByUser(response.data.visitedBy)
          }

          // Load AI detection data if shop has visits
          if (response.data.visitImages && response.data.visitImages.length > 0) {
            await loadAIDetectionData()
          }
        } else {
          setError(response.error || "Failed to load shop data")
        }
      } catch (err) {
        console.error("Error loading shop data:", err)
        setError(err instanceof Error ? err.message : "Failed to load shop data")
      } finally {
        setLoading(false)
      }
    }

    loadShopData()
  }, [shopId])

  // Calculate GPS validation when shop data changes
  useEffect(() => {
    if (shop && shop.visitImages && shop.visitImages.length > 0) {
      calculateGPSValidationForAllVisits()
    }
  }, [shop])

  // Calculate AI detection when shop data changes
  useEffect(() => {
    if (shop && shop.visitImages && shop.visitImages.length > 0) {
      calculateAIDetectionForAllVisits()
    }
  }, [shop])

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!enlargedImage) return
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        navigateToPrevImage()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        navigateToNextImage()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setEnlargedImage(null)
      }
    }

    if (enlargedImage) {
      document.addEventListener('keydown', handleKeyPress)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [enlargedImage, allImages, currentImageIndex])

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
      case "inactive":
        return "bg-red-100 text-red-700 border-red-200"
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const formatFieldName = (key: string) =>
    key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")

  const formatFieldValue = (value: any, fieldName?: string) => {
    if (value === null || value === undefined) return "Not provided"
    
    // Special handling for visitImages - only show essential image paths
    if (fieldName === "visitImages" && Array.isArray(value)) {
      return value.map((img: any, index: number) => (
        <div key={img._id || index} className="mb-3 p-3 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">Visit #{index + 1}</div>
          {img.shopImage && (
            <div className="text-xs text-blue-600 mb-1">
              <strong>Shop Image:</strong> {img.shopImage}
            </div>
          )}
          {img.shelfImage && (
            <div className="text-xs text-green-600">
              <strong>Shelf Image:</strong> {img.shelfImage}
            </div>
          )}
        </div>
      ))
    }
    
    if (typeof value === "object") return JSON.stringify(value, null, 2)
    if (typeof value === "boolean") return value ? "Yes" : "No"
    return String(value)
  }

  const getLatestImages = () => {
    if (!shop?.visitImages?.length) return []
    return shop.visitImages
  }

  const getActualLatestImages = () => {
    const images = getLatestImages()
    return images.length > 0 ? [images[images.length - 1]] : []
  }

  const getPreviousImages = () => {
    const images = getLatestImages()
    return images.length > 1 ? images.slice(0, -1).reverse() : []
  }

  // Get all images for navigation
  const getAllImagesForNavigation = () => {
    const allImgs: string[] = []
    if (shop?.visitImages?.length) {
      shop.visitImages.forEach((img: any) => {
        if (img.shopImage) {
          const fullSrc = img.shopImage.startsWith("http") ? img.shopImage : `${API_BASE_URL || ""}${img.shopImage}`
          allImgs.push(fullSrc)
        }
        if (img.shelfImage) {
          const fullSrc = img.shelfImage.startsWith("http") ? img.shelfImage : `${API_BASE_URL || ""}${img.shelfImage}`
          allImgs.push(fullSrc)
        }
      })
    }
    return allImgs
  }

  // Navigation functions
  const openImageWithNavigation = (imageSrc: string) => {
    const allImgs = getAllImagesForNavigation()
    const index = allImgs.findIndex(img => img === imageSrc)
    setAllImages(allImgs)
    setCurrentImageIndex(index >= 0 ? index : 0)
    setEnlargedImage(imageSrc)
  }

  const navigateToNextImage = () => {
    if (allImages.length > 1) {
      const nextIndex = (currentImageIndex + 1) % allImages.length
      setCurrentImageIndex(nextIndex)
      setEnlargedImage(allImages[nextIndex])
    }
  }

  const navigateToPrevImage = () => {
    if (allImages.length > 1) {
      const prevIndex = currentImageIndex === 0 ? allImages.length - 1 : currentImageIndex - 1
      setCurrentImageIndex(prevIndex)
      setEnlargedImage(allImages[prevIndex])
    }
  }

  const renderImage = (imageSrc: string, altText: string, badgeText: string, badgeColor: string) => {
    const fullImageSrc = imageSrc.startsWith("http") ? imageSrc : `${API_BASE_URL || ""}${imageSrc}`
    return (
      <div className="relative cursor-zoom-in" onClick={() => openImageWithNavigation(fullImageSrc)}>
        <img
          src={fullImageSrc || "/placeholder.svg"}
          alt={altText}
          className="w-full h-64 object-cover rounded-xl shadow-lg border-2 border-gray-200 hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=256&width=400&text=Image+Not+Available"
          }}
        />
        {/* Only show badge if not enlarged */}
        {!enlargedImage && (
          <div className={`absolute top-2 left-2 ${badgeColor} text-white px-3 py-1 rounded-lg text-sm font-semibold`}>
            {badgeText}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
      {/* Image Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md"
          onClick={() => setEnlargedImage(null)}
        >
          <div
            className="relative flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Cross (Close) Top Right - absolutely positioned over the image */}
            <button
              className="absolute top-0 right-0 z-10 bg-white/80 rounded-full p-2 shadow-lg transition hover:bg-pink-200 hover:scale-110 cursor-pointer"
              onClick={() => setEnlargedImage(null)}
              aria-label="Close"
              style={{ cursor: "pointer" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Flex row for arrows and image */}
            <div className="flex items-center w-full">
              {/* Left Arrow Button - OUTSIDE LEFT of image */}
              {allImages.length > 1 && (
                <button
                  className="bg-white/80 rounded-full p-3 shadow-lg transition hover:bg-blue-200 hover:scale-110 cursor-pointer mr-3"
                  onClick={navigateToPrevImage}
                  aria-label="Previous Image"
                  style={{ cursor: "pointer" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-700">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              )}
              {/* The Image itself */}
              <div className="relative">
                <ZoomableImage src={enlargedImage} />
              </div>
              {/* Right Arrow Button - OUTSIDE RIGHT of image */}
              {allImages.length > 1 && (
                <button
                  className="bg-white/80 rounded-full p-3 shadow-lg transition hover:bg-blue-200 hover:scale-110 cursor-pointer ml-3"
                  onClick={navigateToNextImage}
                  aria-label="Next Image"
                  style={{ cursor: "pointer" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-700">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              )}
            </div>
            {/* Image Counter - BELOW IMAGE */}
            {allImages.length > 1 && (
              <div className="mt-4 bg-white/80 px-4 py-2 rounded-full shadow-lg">
                <span className="text-sm font-semibold text-gray-700">
                  {currentImageIndex + 1} / {allImages.length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="w-full px-3 sm:px-4 py-4 sm:py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border-gray-300 text-gray-800 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {shop?.shop_name || shop?.name || "Shop Details"}
          </h1>

              <p className="text-gray-600 mt-1 text-xs sm:text-sm">Detailed information & analytics</p>
            </div>
          </div>
          {/* <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Auditors
          </Button> */}
        </div>
      </div>

      <div className="w-full p-3 sm:p-4 md:p-6">
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-100 border-t-indigo-600 mx-auto mb-8 shadow-lg"></div>
            <p className="text-gray-600 text-xl font-medium">Loading shop details...</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-8 rounded-xl">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg">Error Loading Shop</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* GPS Validation Warning */}
        {shop && !loading && calculatedGPSValidation.length > 0 && (
          (() => {
            const invalidVisits = calculatedGPSValidation.filter((visit: any) => 
              visit.calculatedGPSValidation?.validationStatus === 'invalid'
            )
            const hasInvalidVisits = invalidVisits.length > 0
            
            return hasInvalidVisits ? (
              <Alert variant="destructive" className="mb-8 rounded-xl border-red-500 bg-red-50">
                <XCircle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-lg text-red-800">GPS Validation Failed</AlertTitle>
                <AlertDescription className="text-red-700">
                  This shop visit has been marked as INVALID due to GPS location mismatch. 
                  The user was not at the correct shop location during the visit.
                  {invalidVisits.length > 1 && ` (${invalidVisits.length} invalid visits detected)`}
                </AlertDescription>
              </Alert>
            ) : null
          })()
        )}

        {shop && !loading && (
          <div className="space-y-8">
            {/* Shop Overview */}
            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="bg-gray-50 pb-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                      {shop.shop_name || shop.name || "Shop Details"}
                    </CardTitle>
                    {(shop.rating || shop.validation_score || shop.validationScore) && (
                      <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm w-fit">
                        <Star className="h-5 w-5 text-gray-700 fill-current" />
                        <span className="text-base sm:text-lg font-bold text-gray-800">
                          {(shop.rating || shop.validation_score || shop.validationScore)?.toFixed?.(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Location */}
                <div className="space-y-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-gray-700" />
                    Location
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-sm font-medium text-gray-600">Address</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {shop.address || shop.shop_address || "Not provided"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-sm font-medium text-gray-600">City</p>
                        <p className="text-lg font-semibold text-gray-900">{shop.city || "Not provided"}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-sm font-medium text-gray-600">State</p>
                        <p className="text-lg font-semibold text-gray-900">{shop.state || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Phone className="h-6 w-6 text-gray-700" />
                    Contact
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-sm font-medium text-gray-600">Phone</p>
                      <p className="text-lg font-semibold text-gray-900">{shop.phone || "Not provided"}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-sm font-medium text-gray-600">Email</p>
                      <p className="text-lg font-semibold text-gray-900">{shop.email || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                {/* Assigned Personnel */}
                <div className="space-y-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <UserCheck className="h-6 w-6 text-gray-700" />
                    Assigned User
                  </h3>
                  <div className="space-y-4">
                    {/* Assigned Auditor */}
                    {assignedUser && (
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-semibold text-gray-900">{assignedUser.name}</p>
                          </div>
                          <Badge className="bg-gray-200 text-gray-800">
                            {assignedUser.role.charAt(0).toUpperCase() + assignedUser.role.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    {/* Assigned QC */}
                    {assignedQC && (
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-semibold text-gray-900">{assignedQC.name}</p>
                          </div>
                          <Badge className="bg-gray-200 text-gray-800">
                            {assignedQC.role.charAt(0).toUpperCase() + assignedQC.role.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    {!assignedUser && !assignedQC && (
                      <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl">
                        <p className="text-gray-500 italic">No personnel assigned</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visit History */}
                {shop.visitedBy && (
                  <div className="space-y-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                      <History className="h-6 w-6 text-gray-700" />
                      Visit History
                    </h3>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Last Visitor ({shop.visitImages?.length || 0} visits)</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {visitedByUser ? visitedByUser.name : 'Loading...'}
                          </p>
                        </div>
                        <div className="text-right">
                          {visitedByUser && (
                            <Badge className="bg-gray-200 text-gray-800">
                              {visitedByUser.role.charAt(0).toUpperCase() + visitedByUser.role.slice(1)}
                            </Badge>
                          )}
                          {shop.visitedAt && (
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(shop.visitedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {shop.visitImages?.length > 0 && (
              <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ImageIcon className="h-6 w-6 text-gray-700" />
                    Visit Images
                  </h3>

                  {getLatestImages().length > 1 && (
                  <Button
                  onClick={() => setShowPreviousImages(!showPreviousImages)}
                  className="bg-white text-black rounded-lg border border-gray-300 shadow-sm hover:bg-gray-100"
                >
                  <History className="w-4 h-4 mr-2 text-black" />
                  {showPreviousImages ? "Hide Previous" : "Show Previous"}
                </Button>
                
                  )}
                </div>

                <div className="space-y-6">
                  {/* Latest Images Section */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-700 rounded-full"></span> Latest Upload
                    </h4>
                    {getActualLatestImages().map((img: any) => (
                      <div key={`latest-${img._id}`} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {img.shopImage && renderImage(img.shopImage, "Latest Shop Image", "Shop - New", "bg-gray-800")}
                        {img.shelfImage &&
                          renderImage(img.shelfImage, "Latest Shelf Image", "Shelf - New", "bg-gray-600")}
                      </div>
                    ))}
                  </div>

                  {showPreviousImages && getPreviousImages().length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-md">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                          <div className="w-3 h-3 bg-gray-700 rounded-full shadow-sm"></div>
                          Previous Uploads Archive
                        </h4>
                        <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600">
                            {getPreviousImages().length} visits
                          </span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {getPreviousImages().map((img: any, index: number) => (
                          <div
                            key={`previous-${img._id}-${index}`}
                            className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                  {getPreviousImages().length - index}
                                </div>
                                <div>
                                  <h5 className="font-semibold text-gray-800">
                                    Visit #{getPreviousImages().length - index}
                                  </h5>
                                  <p className="text-sm text-gray-500">Upload Archive</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {img.shopImage && (
                                  <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                    Shop Image
                                  </div>
                                )}
                                {img.shelfImage && (
                                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                                    Shelf Image
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {img.shopImage && (
                              <div key={`${img._id || Math.random()}-shop`} className="relative group cursor-zoom-in" onClick={() => openImageWithNavigation(img.shopImage.startsWith("http") ? img.shopImage : `${API_BASE_URL || ""}${img.shopImage}`)}>
                                <img
                                  src={
                                    img.shopImage.startsWith("http")
                                      ? img.shopImage
                                      : `${API_BASE_URL || ""}${img.shopImage}`
                                  }
                                  alt="Shop"
                                  className="w-full h-48 object-cover rounded-lg shadow-md border-2 border-gray-200 group-hover:scale-105 group-hover:shadow-xl transition-all duration-300"
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement
                                    target.src = "/placeholder.svg?height=192&width=300&text=Shop"
                                  }}
                                />
                                <div className="absolute top-3 left-3 bg-gray-800 text-white px-3 py-1 rounded-lg text-sm font-semibold shadow-lg">
                                  Shop View
                                </div>
                              </div>
                            )}

                            {img.shelfImage && (
                              <div key={`${img._id || Math.random()}-shelf`} className="relative group cursor-zoom-in" onClick={() => openImageWithNavigation(img.shelfImage.startsWith("http") ? img.shelfImage : `${API_BASE_URL || ""}${img.shelfImage}`)}>
                                <img
                                  src={
                                    img.shelfImage.startsWith("http")
                                      ? img.shelfImage
                                      : `${API_BASE_URL || ""}${img.shelfImage}`
                                  }
                                  alt="Shelf"
                                  className="w-full h-48 object-cover rounded-lg shadow-md border-2 border-gray-200 group-hover:scale-105 group-hover:shadow-xl transition-all duration-300"
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement
                                    target.src = "/placeholder.svg?height=192&width=300&text=Shelf"
                                  }}
                                />
                                <div className="absolute top-3 left-3 bg-gray-700 text-white px-3 py-1 rounded-lg text-sm font-semibold shadow-lg">
                                  Shelf View
                                </div>
                              </div>
                            )}
                          </div>

                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* AI Detection Results */}
            {shop.visitImages?.length > 0 && (
              <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Brain className="h-6 w-6 text-blue-700" />
                    AI Detection Results
                    {savingAIDetection && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Saving...
                      </div>
                    )}
                  </h3>
                  {!aiDetectionData && !loadingAI && (
                    <Button
                      onClick={loadAIDetectionData}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Load AI Analysis
                    </Button>
                  )}
                </div>

                {loadingAI ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Analyzing images with AI...</p>
                  </div>
                ) : (aiDetectionData || calculatedAIDetection.length > 0) ? (
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    {(() => {
                      // Use calculated results if available, otherwise use fetched data
                      const summaryData = calculatedAIDetection.length > 0 ? {
                        totalLaysDetected: calculatedAIDetection.reduce((sum, visit) => 
                          sum + (visit.calculatedAIDetection?.laysCount || 0), 0),
                        visitsWithAI: calculatedAIDetection.filter(visit => 
                          visit.calculatedAIDetection?.laysDetected).length,
                        totalVisits: calculatedAIDetection.length
                      } : aiDetectionData?.summary;

                      return summaryData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              {summaryData.totalLaysDetected > 0 ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                              <span className="font-semibold text-gray-800">Lay's Detected</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                              {summaryData.totalLaysDetected}
                            </p>
                            <p className="text-sm text-gray-600">Total products found</p>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Eye className="h-5 w-5 text-purple-600" />
                              <span className="font-semibold text-gray-800">Visits Analyzed</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                              {summaryData.visitsWithAI}
                            </p>
                            <p className="text-sm text-gray-600">Out of {summaryData.totalVisits} total</p>
                          </div>
                        </div>
                      );
                    })()}


                    {/* Detailed Results */}
                    {(() => {
                      // Use calculated results if available, otherwise use fetched data
                      const resultsData = calculatedAIDetection.length > 0 ? calculatedAIDetection : 
                        (aiDetectionData?.results || []);
                      
                      return resultsData.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-800">Visit-by-Visit Analysis</h4>
                          {resultsData.map((result, index) => {
                            const aiDetection = result.calculatedAIDetection || result.aiDetection;
                            return (
                              <div key={result.visitId || index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-semibold text-gray-800">Visit #{index + 1}</h5>
                                  <div className="flex items-center gap-2">
                                    {aiDetection.laysDetected ? (
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : (
                                      <XCircle className="h-5 w-5 text-red-600" />
                                    )}
                                    <span className="text-sm font-medium">
                                      {aiDetection.laysDetected ? 'Lay\'s Found' : 'No Lay\'s'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-600">Products Detected</p>
                                    <p className="font-semibold text-gray-900">{aiDetection.laysCount}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Processed</p>
                                    <p className="font-semibold text-gray-900">
                                      {new Date(aiDetection.processedAt).toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                {/* Logo Detections */}
                                {aiDetection.logoDetections && aiDetection.logoDetections.length > 0 && (
                                  <div className="mt-4">
                                    <p className="text-sm text-gray-600 mb-2">Logo Detections</p>
                                    <div className="space-y-2">
                                      {aiDetection.logoDetections.map((logo: any, logoIndex: number) => (
                                        <div key={logoIndex} className="flex items-center justify-between p-2 bg-white rounded border">
                                          <span className="text-sm font-medium">{logo.description}</span>
                                          <span className="text-sm text-gray-600">
                                            {Math.round(logo.score * 100)}% confidence
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Extracted Text */}
                                {aiDetection.extractedText && (
                                  <div className="mt-4">
                                    <p className="text-sm text-gray-600 mb-2">Extracted Text</p>
                                    <div className="p-3 bg-white rounded border text-sm text-gray-700 max-h-32 overflow-y-auto">
                                      {aiDetection.extractedText}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No AI analysis available. Click "Load AI Analysis" to analyze the images.</p>
                  </div>
                )}
              </Card>
            )}

            {/* GPS Validation Results */}
            {shop.visitImages?.length > 0 && (
              <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl p-4 sm:p-6">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                     <Navigation className="h-6 w-6 text-green-700" />
                     GPS Validation Results
                     {savingGPSValidation && (
                       <div className="flex items-center gap-2 text-sm text-blue-600">
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                         Saving...
                       </div>
                     )}
                   </h3>
                 </div>

                <div className="space-y-6">
                  {/* GPS Validation Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-gray-800">Valid Visits</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {calculatedGPSValidation.filter((visit: any) => visit.calculatedGPSValidation?.isValid).length}
                      </p>
                      <p className="text-sm text-gray-600">Out of {calculatedGPSValidation.length} total</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-gray-800">Invalid Visits</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {calculatedGPSValidation.filter((visit: any) => visit.calculatedGPSValidation?.validationStatus === 'invalid').length}
                      </p>
                      <p className="text-sm text-gray-600">Outside 30m radius</p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <span className="font-semibold text-gray-800">Partial Visits</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {calculatedGPSValidation.filter((visit: any) => visit.calculatedGPSValidation?.validationStatus === 'partial').length}
                      </p>
                      <p className="text-sm text-gray-600">Some locations invalid</p>
                    </div>
                  </div>

                  {/* Visit-by-Visit GPS Analysis */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">Visit-by-Visit GPS Analysis</h4>
                    {calculatedGPSValidation.map((visit: any, index: number) => (
                      <div key={visit._id || index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-gray-800">Visit #{index + 1}</h5>
                          <div className="flex items-center gap-2">
                            {visit.calculatedGPSValidation?.isValid ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : visit.calculatedGPSValidation?.validationStatus === 'partial' ? (
                              <AlertCircle className="h-5 w-5 text-yellow-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                            <Badge className={
                              visit.calculatedGPSValidation?.isValid 
                                ? "bg-green-100 text-green-800" 
                                : visit.calculatedGPSValidation?.validationStatus === 'partial'
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }>
                              {visit.calculatedGPSValidation?.validationStatus === 'valid' ? 'Valid' :
                               visit.calculatedGPSValidation?.validationStatus === 'partial' ? 'Partial' :
                               visit.calculatedGPSValidation?.validationStatus === 'invalid' ? 'Invalid' : 'No Data'}
                            </Badge>
                          </div>
                        </div>
                        
                        {visit.calculatedGPSValidation && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Start Audit */}
                            <div className="p-3 bg-white rounded border">
                              <div className="flex items-center gap-2 mb-2">
                                <MapPinIcon className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium">Start Audit</span>
                                {visit.calculatedGPSValidation.validationDetails?.startAuditValid ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {visit.calculatedGPSValidation.startAuditDistance !== null 
                                  ? `${visit.calculatedGPSValidation.startAuditDistance}m`
                                  : 'No GPS data'
                                }
                              </p>
                            </div>

                            {/* Photo Click */}
                            <div className="p-3 bg-white rounded border">
                              <div className="flex items-center gap-2 mb-2">
                                <ImageIcon className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium">Photo Click</span>
                                {visit.calculatedGPSValidation.validationDetails?.photoClickValid ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {visit.calculatedGPSValidation.photoClickDistance !== null 
                                  ? `${visit.calculatedGPSValidation.photoClickDistance}m`
                                  : 'No GPS data'
                                }
                              </p>
                            </div>

                          </div>
                        )}

                        {/* Shop Coordinates */}
                        {visit.calculatedGPSValidation?.shopCoordinates && 
                         visit.calculatedGPSValidation.shopCoordinates.latitude && 
                         visit.calculatedGPSValidation.shopCoordinates.longitude && (
                          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPinIcon className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">Shop Location</span>
                            </div>
                            <p className="text-sm text-blue-700">
                              {Number(visit.calculatedGPSValidation.shopCoordinates.latitude).toFixed(6)}, {Number(visit.calculatedGPSValidation.shopCoordinates.longitude).toFixed(6)}
                            </p>
                            <p className="text-xs text-blue-600">30m radius validation threshold</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

   <CardContent className="p-0">
  <div className="overflow-x-auto">
    <table className="w-full border border-gray-300 border-collapse">
      <thead>
        <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <th className="border px-6 py-4 text-left font-bold text-gray-700">Field</th>
          <th className="border px-6 py-4 text-left font-bold text-gray-700">Value</th>
          <th className="border px-6 py-4 text-left font-bold text-gray-700">Field</th>
          <th className="border px-6 py-4 text-left font-bold text-gray-700">Value</th>
        </tr>
      </thead>
      <tbody>
        {(() => {
          // 🚫 filter unwanted + empty fields
          const entries = Object.entries(shop).filter(([key, value]) => {
            if (key.toLowerCase() === "id") return false
            if (key.toLowerCase().includes("assigned")) return false
            if (value === null || value === undefined || value === "") return false
            return true
          })

          return Array.from({ length: Math.ceil(entries.length / 2) }).map((_, i) => {
            const first = entries[i * 2]
            const second = entries[i * 2 + 1]
            const rowKey = `${first?.[0] || "empty"}-${second?.[0] || "empty"}`

            const formatFieldName = (field: string) =>
              field
                .replace(/([A-Z])/g, " $1")
                .replace(/_/g, " ")
                .replace(/\bid\b/gi, "")
                .replace(/\bassigned\b/gi, "")
                .trim()
                .replace(/\b\w/g, (char) => char.toUpperCase())

            const formatFieldValue = (value: any, key: string) => {
              if (!value) return "—"
              const lowerKey = key.toLowerCase()
              if (lowerKey.includes("date") || lowerKey.includes("time")) {
                const date = new Date(value)
                if (!isNaN(date.getTime())) {
                  return date.toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })
                }
              }
              return String(value)
            }

            return (
              <tr
                key={rowKey}
                className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50 transition-all duration-200"
              >
                {/* First column */}
                {first && (
                  <>
                    <td className="border px-6 py-4 font-semibold text-gray-600">
                      {formatFieldName(first[0])}
                    </td>
                    <td className="border px-6 py-4 text-gray-900">
                      {first[0].toLowerCase().includes("status") ? (
                        <Badge className={`${getStatusColor(String(first[1]))} font-bold`}>
                          {String(first[1]).toUpperCase()}
                        </Badge>
                      ) : (
                        formatFieldValue(first[1], first[0])
                      )}
                    </td>
                  </>
                )}

                {/* Second column */}
                {second ? (
                  <>
                    <td className="border px-6 py-4 font-semibold text-gray-600">
                      {formatFieldName(second[0])}
                    </td>
                    <td className="border px-6 py-4 text-gray-900">
                      {second[0].toLowerCase().includes("status") ? (
                        <Badge className={`${getStatusColor(String(second[1]))} font-bold`}>
                          {String(second[1]).toUpperCase()}
                        </Badge>
                      ) : (
                        formatFieldValue(second[1], second[0])
                      )}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border px-6 py-4"></td>
                    <td className="border px-6 py-4"></td>
                  </>
                )}
              </tr>
            )
          })
        })()}
      </tbody>
    </table>
  </div>
</CardContent>



          </div>
        )}
      </div>
            {/* Map Section */}
            <div className="mt-10">
              {/* Prepare markers for shop and visitImages locations */}
              {(() => {
                // Shop main location
                const shopLat = shop?.coordinates?.lat || shop?.gps_n || shop?.lat || 30.67
                const shopLng = shop?.coordinates?.lng || shop?.gps_e || shop?.lng || 69.36

                // VisitImages locations (startAudit, photoClick, proceedClick)
                type Marker = {
                  lat: number
                  lng: number
                  label?: string
                  color?: string
                }
                let visitMarkers: Marker[] = []
                if (Array.isArray(shop?.visitImages)) {
                  shop.visitImages.forEach((img, idx) => {
                    // Use visitLocation if present
                    if (img?.visitLocation?.startAudit?.latitude && img?.visitLocation?.startAudit?.longitude) {
                      visitMarkers.push({
                        lat: img.visitLocation.startAudit.latitude,
                        lng: img.visitLocation.startAudit.longitude,
                        label: `Visit Start #${idx + 1}`,
                        color: '#22c55e' // green
                      })
                    }
                    if (img?.visitLocation?.photoClick?.latitude && img?.visitLocation?.photoClick?.longitude) {
                      visitMarkers.push({
                        lat: img.visitLocation.photoClick.latitude,
                        lng: img.visitLocation.photoClick.longitude,
                        label: `Photo Click #${idx + 1}`,
                        color: '#3b82f6' // blue
                      })
                    }
                    if (img?.visitLocation?.proceedClick?.latitude && img?.visitLocation?.proceedClick?.longitude) {
                      visitMarkers.push({
                        lat: img.visitLocation.proceedClick.latitude,
                        lng: img.visitLocation.proceedClick.longitude,
                        label: `Proceed Click #${idx + 1}`,
                        color: '#f59e42' // orange
                      })
                    }
                  })
                }

                // Always show shop location as main marker
                const allMarkers: Marker[] = [
                  {
                    lat: shopLat,
                    lng: shopLng,
                    label: 'Shop Location',
                    color: '#6366f1' // indigo
                  },
                  ...visitMarkers
                ]

                // Legend click handler
                const [selectedPinIdx, setSelectedPinIdx] = useState<number | null>(null)

                // MapDynamic will accept selectedPinIdx and a callback to update it
                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                        <MapPin className="w-5 h-5 text-gray-700" /> Shop Location
                      </h2>
                      {/* Pin color legend slightly left of previous position, clickable */}
                      <div className="flex flex-wrap gap-4 items-center mr-2 sm:mr-6">
                        <span
                          className="flex items-center gap-2 cursor-pointer select-none group"
                          onClick={() => setSelectedPinIdx(0)}
                          tabIndex={0}
                          role="button"
                          aria-label="Shop Location"
                        >
                          <span
                            className="transition-all duration-200"
                            style={{
                              background: '#6366f1',
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              display: 'inline-block',
                              border: '2px solid #fff',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                            }}
                          ></span>
                          <span className="text-sm text-gray-700">Shop Location</span>
                          <style jsx>{`
                            .group:hover span:first-child {
                              transform: scale(1.15);
                              border: 3px solid #22c55e;
                              box-shadow: 0 4px 12px rgba(34,197,94,0.15);
                            }
                          `}</style>
                        </span>
                        {visitMarkers.map((m, idx) => (
                          <span
                            key={idx}
                            className="flex items-center gap-2 cursor-pointer select-none group"
                            onClick={() => setSelectedPinIdx(idx + 1)}
                            tabIndex={0}
                            role="button"
                            aria-label={m.label}
                          >
                            <span
                              className="transition-all duration-200"
                              style={{
                                background: m.color,
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                display: 'inline-block',
                                border: '2px solid #fff',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                              }}
                            ></span>
                            <span className="text-sm text-gray-700">{m.label}</span>
                            <style jsx>{`
                              .group:hover span:first-child {
                                transform: scale(1.15);
                                border: 3px solid #22c55e;
                                box-shadow: 0 4px 12px rgba(34,197,94,0.15);
                              }
                            `}</style>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="w-full h-[400px] rounded-xl overflow-hidden border border-indigo-200 shadow-lg">
                      {/* @ts-ignore: MapDynamic forwards props to Map, which accepts markers and selectedPinIdx */}
                      <MapDynamic markers={allMarkers} selectedPinIdx={selectedPinIdx} />
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        