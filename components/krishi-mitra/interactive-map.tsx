'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation, ArrowRight, ShieldCheck, CheckCircle2, User, Layers, RefreshCw } from 'lucide-react'
import type { CropLot, Bid } from '@/types/database'
import { DEFAULT_CENTER, getCoordinatesForLocation, formatDistance } from '@/lib/geo-utils'

// Helper component to center and pan map smoothly
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, zoom, map])
  return null
}

// Custom Leaflet DivIcons using Tailwind SVG/HTML styles
const createUserIcon = (label: string = 'You') => {
  return L.divIcon({
    className: 'custom-map-user-icon',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background: rgba(59, 130, 246, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 28px; height: 28px; border-radius: 9999px; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold; z-index: 10;">
          📍
        </div>
        <div style="background: #1e3a8a; color: #ffffff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; margin-top: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); white-space: nowrap;">
          ${label}
        </div>
      </div>
    `,
    iconSize: [36, 48],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}

const createCropIcon = (cropName: string, grade: string = 'A', isSafe: boolean = true) => {
  const shortName = cropName.split(' ').slice(-1)[0] || 'Crop'
  return L.divIcon({
    className: 'custom-map-crop-icon',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        <div style="width: 32px; height: 32px; border-radius: 12px; background: ${isSafe ? '#16a34a' : '#ea580c'}; border: 2.5px solid #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white; font-size: 15px; z-index: 10;">
          🌾
        </div>
        <div style="background: #0f172a; color: #ffffff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; margin-top: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.25); white-space: nowrap; border: 1px solid rgba(255,255,255,0.2);">
          ${shortName} · Gr.${grade}
        </div>
      </div>
    `,
    iconSize: [40, 52],
    iconAnchor: [20, 36],
    popupAnchor: [0, -36],
  })
}

const createBidderIcon = (bidderName: string, price: number) => {
  return L.divIcon({
    className: 'custom-map-bidder-icon',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        <div style="width: 32px; height: 32px; border-radius: 9999px; background: #d97706; border: 2.5px solid #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold; z-index: 10;">
          ₹
        </div>
        <div style="background: #78350f; color: #ffffff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; margin-top: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.25); white-space: nowrap;">
          ₹${price.toFixed(1)}/kg
        </div>
      </div>
    `,
    iconSize: [40, 52],
    iconAnchor: [20, 36],
    popupAnchor: [0, -36],
  })
}

interface InteractiveMapProps {
  userLocation?: { lat: number; lng: number } | null
  userLabel?: string
  lots?: CropLot[]
  bids?: Bid[]
  onSelectLot?: (lot: CropLot) => void
  onSelectBid?: (bid: Bid) => void
  height?: string
  zoom?: number
  showLegend?: boolean
}

export default function InteractiveMap({
  userLocation,
  userLabel = 'Your Location',
  lots = [],
  bids = [],
  onSelectLot,
  onSelectBid,
  height = '500px',
  zoom = 11,
  showLegend = true,
}: InteractiveMapProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const centerCoordinates = useMemo<[number, number]>(() => {
    if (userLocation && userLocation.lat && userLocation.lng) {
      return [userLocation.lat, userLocation.lng]
    }
    if (lots.length > 0) {
      const firstLot = lots[0]
      const coords = getCoordinatesForLocation(firstLot.location, firstLot.latitude, firstLot.longitude, firstLot.id)
      return [coords.lat, coords.lng]
    }
    return [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]
  }, [userLocation, lots])

  if (!isMounted) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-border bg-card/60 text-muted-foreground shadow-sm"
        style={{ height }}
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <RefreshCw className="size-4 animate-spin text-primary" /> Loading OpenStreetMap…
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border shadow-md" style={{ height }}>
      <MapContainer
        center={centerCoordinates}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={centerCoordinates} zoom={zoom} />

        {/* 1. User Position Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserIcon(userLabel)}>
            <Popup className="custom-map-popup">
              <div className="p-1 text-xs">
                <p className="font-bold text-primary flex items-center gap-1">📍 {userLabel}</p>
                <p className="text-muted-foreground mt-1">Latitude: {userLocation.lat.toFixed(4)}</p>
                <p className="text-muted-foreground">Longitude: {userLocation.lng.toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 2. Crop Lot Pins (Green/Orange) */}
        {lots.map((lot) => {
          const coords = getCoordinatesForLocation(lot.location, lot.latitude, lot.longitude, lot.id)
          const pricePerKg = Number((lot.asking_price_per_quintal / 100).toFixed(2))

          return (
            <Marker
              key={lot.id}
              position={[coords.lat, coords.lng]}
              icon={createCropIcon(lot.crop_name, lot.grade, lot.pesticide_safe_flag)}
            >
              <Popup className="custom-map-popup">
                <div className="min-w-[200px] p-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-foreground">{lot.crop_name}</h3>
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      Grade {lot.grade}
                    </span>
                  </div>

                  <p className="mt-1 flex items-center gap-1 text-muted-foreground">
                    <MapPin className="size-3 text-primary" /> {lot.location}
                  </p>

                  {lot.distance_km !== undefined && (
                    <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 font-semibold text-primary text-[11px]">
                      📍 {formatDistance(lot.distance_km)}
                    </p>
                  )}

                  <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg bg-secondary/50 p-2 text-[11px]">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Harvest Qty</span>
                      <strong>{lot.quantity_quintal} Q ({lot.quantity_quintal * 100} kg)</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Asking Price</span>
                      <strong className="text-primary font-bold">₹{pricePerKg.toFixed(2)}/kg</strong>
                    </div>
                  </div>

                  {lot.highest_bid_per_kg ? (
                    <div className="mt-2 rounded-md bg-amber-50 dark:bg-amber-950/40 p-1.5 text-[11px] text-amber-900 dark:text-amber-100 flex items-center justify-between border border-amber-200 dark:border-amber-900/60">
                      <span>🏆 Highest Bid:</span>
                      <strong>₹{Number(lot.highest_bid_per_kg).toFixed(2)}/kg</strong>
                    </div>
                  ) : (
                    <p className="mt-1 text-[10px] text-muted-foreground italic">No bids yet · Be the first to bid</p>
                  )}

                  <div className="mt-2 flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
                    <span>Farmer: <strong>{lot.farmer?.full_name || 'Verified Farmer'}</strong></span>
                    {lot.pesticide_safe_flag && <span className="text-green-600 font-semibold">✓ Lab Safe</span>}
                  </div>

                  {onSelectLot && (
                    <button
                      type="button"
                      onClick={() => onSelectLot(lot)}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
                    >
                      {lot.user_bid_per_kg ? 'Submit Counter-Offer' : 'Place Bid / Make Offer'} <ArrowRight className="size-3.5" />
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* 3. Bidder Pins (Gold/Orange on Farmer Map) */}
        {bids.map((bid) => {
          const bidderCoords = getCoordinatesForLocation(bid.buyer?.location || 'Pune', bid.latitude, bid.longitude, bid.id)
          const pricePerKg = bid.bid_price_per_kg ? Number(bid.bid_price_per_kg) : ((bid.bid_price_per_quintal || 0) / 100)
          const buyerName = bid.buyer?.full_name || 'Verified Buyer'

          return (
            <Marker
              key={bid.id}
              position={[bidderCoords.lat, bidderCoords.lng]}
              icon={createBidderIcon(buyerName, pricePerKg)}
            >
              <Popup className="custom-map-popup">
                <div className="min-w-[190px] p-2 text-xs">
                  <div className="flex items-center justify-between gap-2 border-b border-border pb-1.5">
                    <span className="font-bold text-foreground">Buyer Live Offer</span>
                    <span className="rounded bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase">
                      {bid.status}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-xs">
                    <p>Buyer: <strong>{buyerName}</strong></p>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="size-3" /> {bid.buyer?.location || 'Maharashtra'}
                    </p>
                    <div className="mt-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 p-2 text-amber-900 dark:text-amber-100 font-semibold flex justify-between">
                      <span>Bid: ₹{pricePerKg.toFixed(2)}/kg</span>
                      <span>Total: ₹{Number(bid.total_bid_amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {onSelectBid && (
                    <button
                      type="button"
                      onClick={() => onSelectBid(bid)}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground"
                    >
                      Review Offer
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 z-[400] rounded-xl border border-border/80 bg-card/95 p-2.5 shadow-lg backdrop-blur-md text-[11px] space-y-1.5">
          <p className="font-bold text-xs text-foreground uppercase tracking-wider mb-1">Map Legend</p>
          <div className="flex items-center gap-2">
            <span className="flex size-3.5 items-center justify-center rounded-full bg-blue-600 text-[8px] text-white">📍</span>
            <span>Your Current Location</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3.5 rounded bg-green-600"></span>
            <span>Harvest Crops Available ({lots.length})</span>
          </div>
          {bids.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="size-3.5 rounded-full bg-amber-600"></span>
              <span>Active Buyer Bidders ({bids.length})</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
