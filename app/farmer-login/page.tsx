'use client'

import { useRouter } from 'next/navigation'
import FarmerAuth from '@/components/krishi-mitra/farmer-auth'

export default function FarmerLoginPage() {
  const router = useRouter()

  return (
    <FarmerAuth
      onBack={() => router.push('/')}
      onSuccess={() => {
        router.push('/')
        router.refresh()
      }}
    />
  )
}
