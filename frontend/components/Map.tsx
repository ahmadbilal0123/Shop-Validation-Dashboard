"use client"
import { useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"

type LeafletMapProps = {
	lat: number
	lng: number
}

export default function LeafletMap({ lat, lng }: LeafletMapProps) {
	const mapRef = useRef<HTMLDivElement>(null)
	const mapInstanceRef = useRef<any>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (typeof window === "undefined" || !mapRef.current) return
		if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
			setError("Invalid coordinates")
			setIsLoading(false)
			return
		}

		setIsLoading(true)
		setError(null)

		// Import Leaflet dynamically to avoid SSR issues
		import("leaflet").then((L) => {
			try {
				// Fix for default markers in Leaflet with Next.js
				delete (L.Icon.Default.prototype as any)._getIconUrl;
				L.Icon.Default.mergeOptions({
					iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
					iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
					shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
				});

				// Clean up existing map if it exists
				if (mapInstanceRef.current) {
					try {
						mapInstanceRef.current.remove()
					} catch (e) {
						console.log("Error removing existing map:", e)
					}
					mapInstanceRef.current = null
				}

				// Ensure map container exists
				if (!mapRef.current) {
					setError("Map container not found")
					setIsLoading(false)
					return
				}

				// Clear the container
				mapRef.current.innerHTML = ''
				
				// Create new map
				const map = L.map(mapRef.current, {
					center: [lat, lng],
					zoom: 13,
					zoomControl: true,
					attributionControl: false
				})

				// Add tile layer with error handling
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

				// Add marker
				const marker = L.marker([lat, lng])
					.addTo(map)
					.bindPopup(`
						<div style="text-align: center;">
							<strong>Shop Location</strong><br/>
							Lat: ${lat.toFixed(4)}<br/>
							Lng: ${lng.toFixed(4)}
						</div>
					`)

				mapInstanceRef.current = map

				// Force map to resize after a short delay
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

		// Cleanup function
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
	}, [lat, lng])

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