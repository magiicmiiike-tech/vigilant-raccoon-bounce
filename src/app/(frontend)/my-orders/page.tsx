import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

export default async function MyOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const { success } = await searchParams
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login')
  }

  // Fetch user's orders
  const orders = await payload.find({
    collection: 'orders',
    where: {
      user: {
        equals: user.id,
      },
    },
    depth: 3,
    sort: '-orderDate',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/">← Back to Home</Link>
        </Button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        {success && (
          <Alert className="mb-6">
            <AlertDescription>Order placed successfully! 🎉</AlertDescription>
          </Alert>
        )}

        {orders.docs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-6">You haven&apos;t placed any orders yet.</p>
              <Button asChild>
                <Link href="/">Browse Snacks</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.docs.map((order: any) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Order #{String(order.id).slice(-8)}</CardTitle>
                    <Badge
                      variant={
                        order.status === 'pending'
                          ? 'secondary'
                          : order.status === 'completed'
                            ? 'default'
                            : 'destructive'
                      }
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                  <CardDescription>
                    Ordered: {new Date(order.orderDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        {item.snack &&
                          typeof item.snack === 'object' &&
                          item.snack.image &&
                          typeof item.snack.image === 'object' &&
                          item.snack.image.url && (
                            <div className="relative w-16 h-16 rounded overflow-hidden">
                              <Image
                                src={item.snack.image.url}
                                alt={item.snack.image.alt || item.snack.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                        <div className="flex-1">
                          <h4 className="font-medium">{item.snack?.name || 'Unknown Item'}</h4>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          <p className="text-sm text-gray-600">
                            Price: ${(item.snack?.price * item.quantity || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="text-right">
                    <span className="text-lg font-bold">
                      Total: ${order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
