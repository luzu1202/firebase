import { useEffect, useState } from 'react'

const NOT_SUPPORTED = 'Tu navegador no soporta geolocalizacion.'

export function useGeolocation({ enabled }) {
  const [position, setPosition] = useState(null)
  const [error, setError] = useState(() =>
    'geolocation' in navigator ? null : NOT_SUPPORTED,
  )

  useEffect(() => {
    if (!enabled || !('geolocation' in navigator)) {
      return undefined
    }

    let cancelled = false
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (cancelled) return
        setError(null)
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        })
      },
      (err) => {
        if (cancelled) return
        setError(err.message)
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    )

    return () => {
      cancelled = true
      navigator.geolocation.clearWatch(watchId)
    }
  }, [enabled])

  return { position, error }
}
