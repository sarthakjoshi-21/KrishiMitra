'use client'

import React from 'react'
import type { Bid } from '@/types/database'

interface BidRowProps {
  bid: Bid
  index: number
  lotQuantityQuintal?: number
  lotLocation?: string
  isSubmitting?: boolean
  onAccept: (bid: Bid) => void
  onCounter: (bid: Bid) => void
  onReject: (bid: Bid) => void
}

export default function BidRow({
  bid,
  index,
  lotQuantityQuintal = 1,
  lotLocation = 'Maharashtra',
  isSubmitting = false,
  onAccept,
  onCounter,
  onReject,
}: BidRowProps) {
  const pricePerKg = bid.bid_price_per_kg
    ? Number(bid.bid_price_per_kg)
    : bid.bid_price_per_quintal
      ? bid.bid_price_per_quintal / 100
      : 0
  const totalAmount = bid.total_bid_amount
    ? Number(bid.total_bid_amount)
    : pricePerKg * lotQuantityQuintal * 100

  const status = bid.status || 'pending'

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 border border-border/80 bg-card rounded-md mb-2 shadow-sm">
      {/* 1. Left Column (Buyer Info) */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </span>
          <h4 className="text-sm font-bold text-foreground">
            {bid.buyer?.full_name || 'Verified Buyer'}
          </h4>
        </div>
        <p className="text-xs text-muted-foreground">
          Quantity: <span className="font-semibold text-foreground">{lotQuantityQuintal} Quintals ({lotQuantityQuintal * 100} kg)</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Location: <span className="text-foreground">{bid.buyer?.location || lotLocation}</span>
        </p>
        {bid.buyer_notes && (
          <p className="mt-1 text-xs text-muted-foreground bg-secondary/50 p-1.5 rounded italic">
            &ldquo;{bid.buyer_notes}&rdquo;
          </p>
        )}
      </div>

      {/* 2. Center Column (Price & Status) */}
      <div className="flex flex-col items-start md:items-center min-w-[150px]">
        <span className="text-base font-bold text-primary">
          ₹{pricePerKg.toFixed(2)} / kg
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          Total: ₹{(Number(totalAmount) || 0).toLocaleString('en-IN')}
        </span>
        <span
          className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
            status === 'accepted'
              ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
              : status === 'rejected'
                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                : status === 'counter'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
          }`}
        >
          {status === 'accepted'
            ? '✓ Offer accepted'
            : status === 'rejected'
              ? '✗ Offer rejected'
              : status === 'counter'
                ? `↕ Counter: ₹${(Number(bid.counter_price) || 0).toLocaleString('en-IN')}`
                : 'Pending review'}
        </span>
      </div>

      {/* 3. Right Column (Buttons) */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onAccept(bid)}
          disabled={isSubmitting}
          className="rounded-md bg-green-600 hover:bg-green-700 px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => onCounter(bid)}
          disabled={isSubmitting}
          className="rounded-md border border-gray-300 bg-white hover:bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 disabled:opacity-50"
        >
          Counter
        </button>
        <button
          type="button"
          onClick={() => onReject(bid)}
          disabled={isSubmitting}
          className="rounded-md bg-red-50 hover:bg-red-100 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors dark:bg-red-950/60 dark:hover:bg-red-900/40 dark:text-red-300 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  )
}
