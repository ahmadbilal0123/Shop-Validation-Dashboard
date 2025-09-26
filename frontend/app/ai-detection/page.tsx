"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Eye, Search, CheckCircle, XCircle, Loader2 } from "lucide-react"

interface DetectionResult {
  success: boolean
  laysDetected: boolean
  confidence: number
  totalDetected: number
  extractedText?: string
  objects: Array<{
    name: string
    score: number
  }>
  logoDetections?: Array<{
    description: string
    score: number
    boundingPoly?: {
      vertices: Array<{
        x: number
        y: number
      }>
    }
  }>
  error?: string
}

export default function AIDetectionPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
        // Load image to get dimensions
        const img = new Image()
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
      setResult(null) // Clear previous results
    }
  }

  const analyzeImage = async () => {
    if (!selectedFile) return

    setAnalyzing(true)
    setResult(null)

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          // Remove data:image/...;base64, prefix
          resolve(result.split(',')[1])
        }
        reader.readAsDataURL(selectedFile)
      })

      // Call Google Cloud Vision API
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=AIzaSyDvEOdOU5EeOA-MmZzFOElzh6s7tmmLVpY`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64
                },
                features: [
                  {
                    type: 'OBJECT_LOCALIZATION',
                    maxResults: 10
                  },
                  {
                    type: 'LABEL_DETECTION',
                    maxResults: 20
                  },
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 50
                  },
                  {
                    type: 'LOGO_DETECTION',
                    maxResults: 10
                  }
                ]
              }
            ]
          })
        }
      )

      const data = await response.json()
      
      if (data.responses && data.responses[0]) {
        const response = data.responses[0]
        const objects = response.localizedObjectAnnotations || []
        const labels = response.labelAnnotations || []
        const textAnnotations = response.textAnnotations || []
        const logoAnnotations = response.logoAnnotations || []

        // Extract all text from the image using OCR
        const extractedText = textAnnotations.length > 0 ? textAnnotations[0].description : ''
        console.log('Extracted text from image:', extractedText)

        // Check for Lays logos detected
        const laysLogoKeywords = [
          'lays', 'lay\'s', 'lay s', 'lais', 'lai\'s', 'frito-lay', 'frito lay'
        ]

        const laysLogosFound = logoAnnotations.filter((logo: any) => 
          laysLogoKeywords.some(keyword => 
            logo.description.toLowerCase().includes(keyword.toLowerCase())
          )
        )

        console.log('All logos detected:', logoAnnotations.map((logo: any) => ({ description: logo.description, score: logo.score })))
        console.log('Lays logos found:', laysLogosFound.map((logo: any) => ({ description: logo.description, score: logo.score })))

        // Check for Lays products specifically using OCR text detection
        const laysTextKeywords = [
          'lays', 'lay\'s', 'lay s', 'lais', 'lai\'s',
          'lays classic', 'lays masala', 'lays magic masala', 
          'lays american style cream & onion', 'lays india\'s magic masala', 
          'lays spanish tomato tango', 'lays french cheese & herbs',
          'lays maxx macho chilli', 'lays maxx', 'lays wavy', 'lays stax', 'lays poppables',
          'lays french cheese', 'lays cream onion', 'lays cheese herbs',
          'lays tomato tango', 'lays macho chilli'
        ]

        // Check if any Lays text is found in the image
        const laysTextFound = laysTextKeywords.some(keyword => 
          extractedText.toLowerCase().includes(keyword.toLowerCase())
        )

        console.log('Lays text found in image:', laysTextFound)
        console.log('Lays logos found in image:', laysLogosFound.length > 0)

        // If Lays logo OR text is found, then look for chip-related objects/labels
        let laysObjects: any[] = []
        let laysLabels: any[] = []
        const laysDetected = laysTextFound || laysLogosFound.length > 0

        if (laysDetected) {
          // Only use logo detection - count each Lay's logo as one product
          const logoObjects = laysLogosFound.map((logo: any) => ({
            name: `Lays Logo: ${logo.description}`,
            score: logo.score
          }))
          laysLabels = logoObjects
          laysObjects = [] // Don't use generic object detection
        } else {
          // If no Lays logo or text found, don't detect anything (strict Lays-only detection)
          laysObjects = []
          laysLabels = []
        }

        // Count total Lays products detected
        const totalLaysDetected = laysObjects.length + laysLabels.length
        const finalLaysDetected = totalLaysDetected > 0
        
        // Calculate average confidence
        const allLaysScores = [
          ...laysObjects.map((obj: any) => obj.score),
          ...laysLabels.map((label: any) => label.score)
        ]
        const averageConfidence = allLaysScores.length > 0 
          ? allLaysScores.reduce((sum, score) => sum + score, 0) / allLaysScores.length
          : 0

        // Debug logging
        console.log('=== OCR TEXT DETECTION ===')
        console.log('Extracted text:', extractedText)
        console.log('Lays text found:', laysTextFound)
        console.log('=== LOGO DETECTION ===')
        console.log('All logos detected:', logoAnnotations.map((logo: any) => ({ 
          description: logo.description, 
          score: logo.score,
          boundingPoly: logo.boundingPoly 
        })))
        console.log('Lays logos found:', laysLogosFound.map((logo: any) => ({ 
          description: logo.description, 
          score: logo.score,
          boundingPoly: logo.boundingPoly 
        })))
        console.log('=== OBJECT DETECTION ===')
        console.log('All objects detected:', objects.map((obj: any) => ({ name: obj.name, score: obj.score })))
        console.log('All labels detected:', labels.map((label: any) => ({ description: label.description, score: label.score })))
        console.log('=== FINAL RESULTS ===')
        console.log('Lays objects found:', laysObjects.map((obj: any) => ({ name: obj.name, score: obj.score })))
        console.log('Lays labels found:', laysLabels.map((label: any) => ({ name: label.name || label.description, score: label.score })))
        console.log('Total Lays detected:', totalLaysDetected)

        setResult({
          success: true,
          laysDetected: finalLaysDetected,
          confidence: averageConfidence,
          totalDetected: totalLaysDetected,
          extractedText: extractedText,
          logoDetections: laysLogosFound.map((logo: any) => ({
            description: logo.description,
            score: logo.score,
            boundingPoly: logo.boundingPoly
          })),
          objects: [
            ...laysObjects.map((obj: any) => ({ name: obj.name, score: obj.score })),
            ...laysLabels.map((label: any) => ({ name: label.name || label.description, score: label.score }))
          ]
        })
      } else {
        setResult({
          success: false,
          laysDetected: false,
          confidence: 0,
          totalDetected: 0,
          objects: [],
          error: 'No analysis results received'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        laysDetected: false,
        confidence: 0,
        totalDetected: 0,
        objects: [],
        error: error instanceof Error ? error.message : 'Analysis failed'
      })
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Snack Detection
          </h1>
          <p className="text-gray-600 text-lg">
            Upload a shelf image to detect Lays chips and other snacks
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="mb-4"
                />
                <p className="text-gray-500 text-sm">
                  Select an image of a shelf or snack display
                </p>
              </div>

              {imagePreview && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Preview:</h3>
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg border"
                    />
                    {/* Bounding boxes overlay */}
                    {result?.logoDetections && result.logoDetections.length > 0 && (
                      <div className="absolute inset-0">
                        {result.logoDetections.map((detection, index) => {
                          if (!detection.boundingPoly || !detection.boundingPoly.vertices || !imageDimensions) return null
                          
                          const vertices = detection.boundingPoly.vertices
                          if (vertices.length < 2) return null
                          
                          // Calculate bounding box coordinates in pixels
                          const minX = Math.min(...vertices.map(v => v.x || 0))
                          const maxX = Math.max(...vertices.map(v => v.x || 0))
                          const minY = Math.min(...vertices.map(v => v.y || 0))
                          const maxY = Math.max(...vertices.map(v => v.y || 0))
                          
                          // Convert to percentage based on actual image dimensions
                          const left = (minX / imageDimensions.width) * 100
                          const top = (minY / imageDimensions.height) * 100
                          const width = ((maxX - minX) / imageDimensions.width) * 100
                          const height = ((maxY - minY) / imageDimensions.height) * 100
                          
                          return (
                            <div
                              key={index}
                              className="absolute border-2 border-red-500 bg-red-500/20"
                              style={{
                                left: `${left}%`,
                                top: `${top}%`,
                                width: `${width}%`,
                                height: `${height}%`,
                              }}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={analyzeImage}
                disabled={!selectedFile || analyzing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Detect Lays Snacks
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Detection Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!result && !analyzing && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Upload an image and click "Detect Lays Snacks" to see results</p>
                </div>
              )}

              {analyzing && (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-600" />
                  <p className="text-gray-600">Analyzing image with AI...</p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {/* Main Result */}
                  <Alert className={result.laysDetected ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <div className="flex items-center gap-2">
                      {result.laysDetected ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <AlertDescription className="font-semibold">
                        {result.laysDetected 
                          ? `✅ ${result.totalDetected} Lays product${result.totalDetected > 1 ? 's' : ''} detected! (${(result.confidence * 100).toFixed(1)}% confidence)`
                          : "❌ No Lays products detected"
                        }
                      </AlertDescription>
                    </div>
                  </Alert>

                  {/* Product Count */}
                  {result.laysDetected && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-900 mb-2">Detection Summary</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{result.totalDetected}</div>
                          <div className="text-sm text-green-700">Lays Product{result.totalDetected > 1 ? 's' : ''}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{(result.confidence * 100).toFixed(0)}%</div>
                          <div className="text-sm text-blue-700">Confidence</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Confidence Score */}
                  {result.laysDetected && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">Confidence Score</h3>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${result.confidence * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-blue-700 text-sm mt-1">
                        {(result.confidence * 100).toFixed(1)}% average confidence
                      </p>
                    </div>
                  )}

                  {/* Detection Visualization */}
                  {result.logoDetections && result.logoDetections.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-900 mb-2">Detection Visualization:</h3>
                      <div className="space-y-2">
                        {result.logoDetections.map((detection, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-green-100 rounded">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-red-500 border border-red-600"></div>
                              <span className="font-medium text-green-800">
                                {detection.description}
                              </span>
                            </div>
                            <Badge variant="secondary" className="bg-green-200 text-green-800">
                              {(detection.score * 100).toFixed(1)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-green-700 mt-2">
                        Red boxes in the preview image show detected Lay's logos
                      </p>
                    </div>
                  )}

                  {/* Extracted Text */}
                  {result.extractedText && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-yellow-900 mb-2">Text Found in Image:</h3>
                      <p className="text-sm text-yellow-800 bg-yellow-100 p-2 rounded">
                        {result.extractedText.substring(0, 200)}
                        {result.extractedText.length > 200 && '...'}
                      </p>
                    </div>
                  )}

                  {/* Detected Objects */}
                  {result.objects.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Detected Items:</h3>
                      <div className="space-y-2">
                        {result.objects.map((obj, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="font-medium">{obj.name}</span>
                            <Badge variant="secondary">
                              {(obj.score * 100).toFixed(1)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {result.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{result.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8 bg-white shadow-lg">
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Take a clear photo of a shelf or snack display</li>
              <li>Upload the image using the file input above</li>
              <li>Click "Detect Lays Snacks" to analyze the image</li>
              <li>View the AI detection results and confidence scores</li>
            </ol>
            <p className="mt-4 text-sm text-gray-500">
              <strong>Note:</strong> This AI model specifically detects Lays products only, 
              not other chip brands. It will count and show the exact number of Lays products found in the image.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
