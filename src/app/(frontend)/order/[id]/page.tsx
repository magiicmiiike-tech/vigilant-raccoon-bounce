import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import OrderForm from './order-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface OrderPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login')
  }

  // Fetch the specific snack
  const snack = await payload.findByID({
    collection: 'snacks',
    id,
    depth: 2,
  })

  if (!snack || !snack.available) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Snack Not Available</CardTitle>
              <CardDescription>Sorry, this snack is not available for ordering.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/">← Back to Snacks</Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Snack Details */}
          <Card className="overflow-hidden">
            {snack.image && typeof snack.image === 'object' && snack.image.url && (
              <div className="aspect-video relative">
                <Image
                  src={snack.image.url}
                  alt={snack.image.alt || snack.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{snack.name}</CardTitle>
                <Badge variant="secondary">{snack.category}</Badge>
              </div>
              <CardDescription>{snack.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">${snack.price.toFixed(2)} each</p>
            </CardContent>
          </Card>

          {/* Order Form */}
          <Card>
            <CardHeader>
              <CardTitle>Place Your Order</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderForm snack={snack} user={user} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
