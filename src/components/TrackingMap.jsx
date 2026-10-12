import { useEffect } from 'react'
import {
  AdvancedMarker,
  APIProvider,
  Map,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const DEFAULT_CENTER = { lat: -0.1807, lng: -78.4678 }
const DEFAULT_ZOOM = 16

function MapFollower({ position }) {
  const map = useMap()

  useEffect(() => {
    if (map && position) {
      map.panTo({ lat: position.lat, lng: position.lng })
    }
  }, [map, position])

  return null
}

export default function TrackingMap({ position }) {
  const markerPosition = position
    ? { lat: position.lat, lng: position.lng }
    : null

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        mapId="DEMO_MAP_ID"
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling="greedy"
        style={{ width: '100%', height: '100%' }}
      >
        <MapFollower position={markerPosition} />
        {markerPosition && (
          <AdvancedMarker position={markerPosition}>
            <Pin
              background="#aa3bff"
              borderColor="#7a1fd0"
              glyphColor="#ffffff"
              scale={1.3}
            />
          </AdvancedMarker>
        )}
      </Map>
    </APIProvider>
  )
}
