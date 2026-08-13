'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api'
import { MapPin } from 'lucide-react'

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

const defaultCenter = {
  lat: -1.286389,
  lng: 36.817223,
}

export type MapRoom = {
  id: string
  name: string
  type: string
  rent: number
  lat: number | null
  lng: number | null
  buildingName: string
  buildingArea: string
  buildingTown: string
}

type MapProps = {
  rooms: MapRoom[]
  center?: { lat: number; lng: number }
  zoom?: number
}

export function Map({ rooms, center, zoom = 13 }: MapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const router = useRouter()

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey ?? '',
  })

  const validRooms = useMemo(
    () => rooms.filter((r): r is MapRoom & { lat: number; lng: number } => r.lat !== null && r.lng !== null),
    [rooms]
  )

  const mapCenter = useMemo(() => {
    if (center) return center
    if (validRooms.length > 0) return { lat: validRooms[0].lat, lng: validRooms[0].lng }
    return defaultCenter
  }, [center, validRooms])

  if (loadError) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-700">
        <p>Failed to load Google Maps. Check that NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set.</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50">
        <div className="flex items-center gap-2 text-zinc-500">
          <MapPin size={20} className="animate-bounce" />
          Loading map…
        </div>
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={zoom}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      {validRooms.map((room) => (
        <MarkerF
          key={room.id}
          position={{ lat: room.lat, lng: room.lng }}
          title={`${room.name} — ${room.type}`}
          onClick={() => router.push(`/room/${room.id}`)}
          label={{
            text: `KES ${room.rent.toLocaleString()}`,
            className: 'text-xs font-semibold text-zinc-900 bg-white px-2 py-1 rounded shadow',
          }}
        />
      ))}
    </GoogleMap>
  )
}
