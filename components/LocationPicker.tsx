'use client'

import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api'
import { MapPin, X } from 'lucide-react'

export type LatLng = { lat: number; lng: number }

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

const defaultCenter: LatLng = {
  lat: -1.286389,
  lng: 36.817223,
}

type LocationPickerProps = {
  value: LatLng | null
  onChange: (value: LatLng | null) => void
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  })

  if (loadError) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-700">
        Failed to load Google Maps.
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <MapPin size={16} className="animate-bounce" />
          Loading map…
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <div className="h-[220px]">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={value ?? defaultCenter}
          zoom={value ? 16 : 11}
          onClick={(e) => {
            if (e.latLng) onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() })
          }}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {value && (
            <MarkerF
              position={value}
              draggable
              onDragEnd={(e) => {
                if (e.latLng) onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() })
              }}
            />
          )}
        </GoogleMap>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-zinc-200 bg-zinc-50 px-3 py-2">
        <p className="truncate text-xs text-zinc-500">
          {value
            ? `Pin: ${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`
            : 'Click the map to drop the exact building pin (drag to adjust).'}
        </p>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
