"use client"

import { useEffect, useRef } from "react"

interface LiveLocationMapProps {
  lat: number
  lng: number
}

export function LiveLocationMap({ lat, lng }: LiveLocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<import("mapbox-gl").Map | null>(null)
  const markerRef = useRef<import("mapbox-gl").Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!token) return

    let cancelled = false

    ;(async () => {
      const mapboxgl = await import("mapbox-gl")
      if (cancelled || !containerRef.current) return

      mapboxgl.default.accessToken = token

      const map = new mapboxgl.default.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [lng, lat],
        zoom: 14,
      })

      const marker = new mapboxgl.default.Marker().setLngLat([lng, lat]).addTo(map)

      mapRef.current = map
      markerRef.current = marker
    })()

    return () => {
      cancelled = true
      markerRef.current?.remove()
      markerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [lat, lng])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current

    if (!map || !marker) return

    marker.setLngLat([lng, lat])
    map.easeTo({ center: [lng, lat], duration: 500 })
  }, [lat, lng])

  const hasToken = Boolean(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN)

  if (!hasToken) {
    return (
      <div className="rounded-md border p-3 text-sm text-muted-foreground">
        Mapbox token missing. Set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` in `.env.local`.
      </div>
    )
  }

  return <div ref={containerRef} className="h-80 w-full overflow-hidden rounded-md border" />
}
