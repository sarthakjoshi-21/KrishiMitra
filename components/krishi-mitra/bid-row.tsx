'use client'

import React from 'react'
import type { Bid } from '@/types/database'
import { useLanguage } from './language-context'
import { t } from '@/lib/translations'

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
  const { language } = useLanguage()

  const pricePerKg = bid.bid_price_per_kg
    ? Number(bid.bid_price_per_kg)
    : bid.bid_price_per_quintal
      ? bid.bid_price_per_quintal / 100
      : 0
  const totalAmount = bid.total_bid_amount
    ? Number(bid.total_bid_amount)
    : pricePerKg * lotQuantityQuintal * 100

  const status = bid.status || 'pending'
  const isCounter = status === 'counter' || status === 'countered'
  const isBuyerCounter = isCounter && bid.counter_by === 'buyer'
  const isFarmerCounter = isCounter && (bid.counter_by === 'farmer' || !bid.counter_by)
  const counterPricePerKg = Number(bid.counter_price_per_kg || bid.counter_price || 0)
  const counterTotal = counterPricePerKg * lotQuantityQuintal * 100

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 border border-border/80 bg-card rounded-md mb-2 shadow-sm">
      {/* 1. Left Column (Buyer Info) */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </span>
          <h4 className="text-sm font-bold text-foreground">
            {bid.buyer?.full_name || t('common.verifiedBuyer', language)}
          </h4>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('bidRow.quantity', language)}: <span className="font-semibold text-foreground">{lotQuantityQuintal} {t('common.quintals', language)} ({lotQuantityQuintal * 100} {t('common.kg', language)})</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {t('bidRow.location', language)}: <span className="text-foreground">{bid.buyer?.location || lotLocation}</span>
        </p>
        {bid.buyer_notes && (
          <p className="mt-1 text-xs text-muted-foreground bg-secondary/50 p-1.5 rounded italic">
            &ldquo;{bid.buyer_notes}&rdquo;
          </p>
        )}
      </div>

      {/* 2. Center Column (Price & Status) */}
      <div className="flex flex-col items-start md:items-center min-w-[170px]">
        {isBuyerCounter ? (
          <div className="flex flex-col items-start md:items-center">
            <span className="text-xs text-muted-foreground line-through">
              Original: ₹{pricePerKg.toFixed(2)} / {t('common.kg', language)}
            </span>
            <span className="text-base font-extrabold text-purple-700 dark:text-purple-300">
              ₹{counterPricePerKg.toFixed(2)} / {t('common.kg', language)}
            </span>
            <span className="text-xs text-muted-foreground font-semibold">
              {t('bidRow.total', language)}: ₹{(Number(counterTotal) || 0).toLocaleString('en-IN')}
            </span>
          </div>
        ) : isFarmerCounter ? (
          <div className="flex flex-col items-start md:items-center">
            <span className="text-xs text-muted-foreground line-through">
              Bid: ₹{pricePerKg.toFixed(2)} / {t('common.kg', language)}
            </span>
            <span className="text-base font-bold text-amber-700 dark:text-amber-300">
              Counter: ₹{counterPricePerKg.toFixed(2)} / {t('common.kg', language)}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {t('bidRow.total', language)}: ₹{(Number(counterTotal) || 0).toLocaleString('en-IN')}
            </span>
          </div>
        ) : (
          <>
            <span className="text-base font-bold text-primary">
              ₹{pricePerKg.toFixed(2)} / {t('common.kg', language)}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {t('bidRow.total', language)}: ₹{(Number(totalAmount) || 0).toLocaleString('en-IN')}
            </span>
          </>
        )}

        <span
          className={`mt-1.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
            status === 'accepted'
              ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
              : status === 'rejected'
                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                : isBuyerCounter
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 animate-pulse'
                  : isFarmerCounter
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
          }`}
        >
          {status === 'accepted'
            ? t('bidRow.statusAccepted', language)
            : status === 'rejected'
              ? t('bidRow.statusRejected', language)
              : isBuyerCounter
                ? `⚡ Buyer Counter: ₹${counterPricePerKg.toFixed(2)}/kg`
                : isFarmerCounter
                  ? `↕ Counter Sent (Awaiting Buyer)`
                  : t('bidRow.statusPending', language)}
        </span>

        {bid.counter_notes && (
          <span className="mt-1 text-[11px] italic text-muted-foreground max-w-[200px] text-center truncate" title={bid.counter_notes}>
            &ldquo;{bid.counter_notes}&rdquo;
          </span>
        )}
      </div>

      {/* 3. Right Column (Buttons) */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onAccept(bid)}
          disabled={isSubmitting || status === 'accepted' || status === 'rejected'}
          className="rounded-md bg-green-600 hover:bg-green-700 px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          {isBuyerCounter ? 'Accept Counter' : t('bidRow.accept', language)}
        </button>
        <button
          type="button"
          onClick={() => onCounter(bid)}
          disabled={isSubmitting || status === 'accepted' || status === 'rejected'}
          className="rounded-md border border-gray-300 bg-white hover:bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 disabled:opacity-50"
        >
          {isFarmerCounter ? 'Revise Counter' : t('bidRow.counter', language)}
        </button>
        <button
          type="button"
          onClick={() => onReject(bid)}
          disabled={isSubmitting || status === 'accepted' || status === 'rejected'}
          className="rounded-md bg-red-50 hover:bg-red-100 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors dark:bg-red-950/60 dark:hover:bg-red-900/40 dark:text-red-300 disabled:opacity-50"
        >
          {t('bidRow.reject', language)}
        </button>
      </div>
    </div>
  )
}
