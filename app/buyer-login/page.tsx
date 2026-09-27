'use client'

import { useRouter } from 'next/navigation'
import BuyerAuth from '@/components/krishi-mitra/buyer-auth'

export default function BuyerLoginPage() {
  const router = useRouter()

  return (
    <BuyerAuth
      onBack={() => router.push('/')}
      onSuccess={() => {
        router.push('/')
        router.refresh()
      }}
    />
  )
}
