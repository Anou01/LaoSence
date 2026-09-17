import { useState } from 'react'
import MapComponent from '@/components/MapComponent'
import type { LocationPosition } from '@/utils/locationUtils'

export default function AdminMapPage() {
  const [userLocation, setUserLocation] = useState<LocationPosition | null>(null)

  const handleLocationUpdate = (location: LocationPosition | null) => {
    setUserLocation(location)
    // You can add additional logic here if needed
    console.log('Admin map location updated:', location)
  }

  return (
    <div className="h-screen w-full">
      <MapComponent
        userLocation={userLocation}
        onLocationUpdate={handleLocationUpdate}
        center={[17.9757, 102.6369]}
        zoom={7}
        minZoom={5}
        maxZoom={18}
        className="h-full w-full"
        showLocationButton={true}
        locationButtonPosition="bottomleft"
        zoomControlPosition="bottomleft"
      />
    </div>
  )
}