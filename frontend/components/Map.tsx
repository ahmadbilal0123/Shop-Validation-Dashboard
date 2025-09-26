"use client"
import { useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"


type Marker = {
	lat: number
	lng: number
	label?: string
	color?: string // CSS color string
}

type LeafletMapProps = {
	lat?: number
	lng?: number
	markers?: Marker[]
	selectedPinIdx?: number | null
}

export default function LeafletMap({ lat, lng, markers, selectedPinIdx }: LeafletMapProps) {
	const mapRef = useRef<HTMLDivElement>(null)
	const mapInstanceRef = useRef<any>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

			// Store marker refs for popup control
			const markerRefs = useRef<any[]>([])

			useEffect(() => {
				if (typeof window === "undefined" || !mapRef.current) return

				let centerLat = lat, centerLng = lng
				if (markers && markers.length > 0) {
					centerLat = markers[0].lat
					centerLng = markers[0].lng
				}
				if (typeof centerLat !== "number" || typeof centerLng !== "number" || isNaN(centerLat) || isNaN(centerLng)) {
					setError("Invalid coordinates")
					setIsLoading(false)
					return
				}

				setIsLoading(true)
				setError(null)

				import("leaflet").then((L) => {
					try {
						delete (L.Icon.Default.prototype as any)._getIconUrl;
						L.Icon.Default.mergeOptions({
							iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
							iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
							shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
						});

						if (mapInstanceRef.current) {
							try {
								mapInstanceRef.current.remove()
							} catch (e) {
								console.log("Error removing existing map:", e)
							}
							mapInstanceRef.current = null
						}

						if (!mapRef.current) {
							setError("Map container not found")
							setIsLoading(false)
							return
						}

						mapRef.current.innerHTML = ''

						const map = L.map(mapRef.current, {
							center: [centerLat, centerLng],
							zoom: 13,
							zoomControl: true,
							attributionControl: false
						})

						const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
							attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
							maxZoom: 19,
							minZoom: 1
						})

						tileLayer.on('load', () => {
							setIsLoading(false)
						})

						tileLayer.on('tileerror', (e) => {
							console.log("Tile loading error:", e)
							setIsLoading(false)
						})

						tileLayer.addTo(map)

						// Add markers and store refs
						markerRefs.current = []
						if (markers && markers.length > 0) {
							markers.forEach((m) => {
								let icon = undefined
								if (m.color) {
									icon = L.divIcon({
										className: '',
										html: `<div style="background:${m.color};border-radius:50%;width:28px;height:28px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.15);"></div>`,
										iconSize: [28, 28],
										iconAnchor: [14, 28],
									})
								}
								const marker = L.marker([m.lat, m.lng], icon ? { icon } : undefined)
									.addTo(map)
									.bindPopup(`
										<div style="text-align: center;">
											<strong>${m.label || "Location"}</strong><br/>
											Lat: ${m.lat.toFixed(6)}<br/>
											Lng: ${m.lng.toFixed(6)}
										</div>
									`)
								markerRefs.current.push(marker)
							})
						} else if (typeof lat === "number" && typeof lng === "number") {
							const marker = L.marker([lat, lng])
								.addTo(map)
								.bindPopup(`
									<div style="text-align: center;">
										<strong>Shop Location</strong><br/>
										Lat: ${lat.toFixed(6)}<br/>
										Lng: ${lng.toFixed(6)}
									</div>
								`)
							markerRefs.current.push(marker)
						}

						mapInstanceRef.current = map

						setTimeout(() => {
							if (mapInstanceRef.current) {
								mapInstanceRef.current.invalidateSize()
							}
							setIsLoading(false)
						}, 100)

					} catch (err) {
						console.error("Error initializing map:", err)
						setError("Failed to initialize map")
						setIsLoading(false)
					}
				}).catch((err) => {
					console.error("Error loading Leaflet:", err)
					setError("Failed to load map library")
					setIsLoading(false)
				})

				return () => {
					if (mapInstanceRef.current) {
						try {
							mapInstanceRef.current.remove()
						} catch (e) {
							console.log("Error during cleanup:", e)
						}
						mapInstanceRef.current = null
					}
				}
			}, [lat, lng, JSON.stringify(markers)])

			// Pan/open popup for selected pin
			useEffect(() => {
				if (selectedPinIdx != null && markerRefs.current[selectedPinIdx] && mapInstanceRef.current) {
					const marker = markerRefs.current[selectedPinIdx]
					
					// Reset all markers to default z-index
					markerRefs.current.forEach((m, idx) => {
						if (m && m.setZIndexOffset) {
							m.setZIndexOffset(0)
						}
					})
					
					// Bring selected marker to front
					if (marker.setZIndexOffset) {
						marker.setZIndexOffset(1000)
					}
					
					mapInstanceRef.current.setView(marker.getLatLng(), 16, { animate: true })
					marker.openPopup()
				}
			}, [selectedPinIdx])

	if (error) {
		return (
			<div style={{ 
				height: "400px", 
				width: "100%", 
				display: "flex", 
				alignItems: "center", 
				justifyContent: "center",
				backgroundColor: "#f8f9fa",
				border: "1px solid #dee2e6",
				borderRadius: "8px",
				color: "#6c757d"
			}}>
				{error}
			</div>
		)
	}

	return (
		<div style={{ position: "relative", height: "400px", width: "100%" }}>
			{isLoading && (
				<div style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#f8f9fa",
					zIndex: 1000,
					borderRadius: "8px"
				}}>
					<div>Loading map...</div>
				</div>
			)}
			<div 
				ref={mapRef} 
				style={{ 
					height: "100%", 
					width: "100%",
					borderRadius: "8px",
					overflow: "hidden"
				}}
			/>
		</div>
	)
}