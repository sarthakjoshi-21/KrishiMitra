'use client'

import dynamic from 'next/dynamic'
import React from 'react'
import { RefreshCw } from 'lucide-react'

// Dynamically import Leaflet InteractiveMap with SSR disabled
const DynamicInteractiveMap = dynamic(
  () => import('@/components/krishi-mitra/interactive-map'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[450px] w-full items-center justify-center rounded-2xl border border-border bg-card/50 text-muted-foreground">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <RefreshCw className="size-4 animate-spin text-primary" /> Loading Interactive OpenStreetMap…
        </div>
      </div>
    ),
  }
)

export default function InteractiveMap(props: React.ComponentProps<typeof DynamicInteractiveMap>) {
  return <DynamicInteractiveMap {...props} />
}
