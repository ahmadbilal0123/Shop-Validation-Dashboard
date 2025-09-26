import dynamic from "next/dynamic"
import { memo } from "react"

const Map = dynamic(() => import("@/components/Map"), { 
  ssr: false,
  loading: () => <div style={{ height: "400px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6", borderRadius: "12px" }}>Loading map...</div>
})

// Memoize the component to prevent unnecessary re-renders
const MapDynamic = memo(function MapDynamic(props) {
  return <Map {...props} />
})

export default MapDynamic