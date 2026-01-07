import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import OrderStatusUpdate from './order-status-update'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default async function AdminDashboardPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to login if not authenticated or not admin
  if (!user || (user as any).role !== 'admin') {
    redirect('/')
  }

  // Fetch all orders
  const orders = await payload.find({
    collection: 'orders',
    depth: 3,
    sort: '-orderDate',
    limit: 50,
  })

  // Get order statistics
  const pendingOrders = orders.docs.filter((order: any) => order.status === 'pending')
  const completedOrders = orders.docs.filter((order: any) => order.status === 'completed')
  const cancelledOrders = orders.docs.filter((order: any) => order.status === 'cancelled')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/">← Back to Home</Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Cancelled Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{cancelledOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{orders.docs.length}</div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* Orders Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">All Orders</h2>

          {orders.docs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">No orders found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.docs.map((order: any) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{String(order.id).slice(-8)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Customer: {order.user?.firstName} {order.user?.lastName} (
                          {order.user?.email})
                        </CardDescription>
                        <p className="text-sm text-gray-500 mt-1">
                          Ordered:{' '}
                          {new Date(order.orderDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
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
                        <OrderStatusUpdate orderId={order.id} currentStatus={order.status} />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {order.items.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          {item.snack &&
                            typeof item.snack === 'object' &&
                            item.snack.image &&
                            typeof item.snack.image === 'object' &&
                            item.snack.image.url && (
                              <div className="relative w-12 h-12 rounded overflow-hidden">
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
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity} × ${item.snack?.price?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div className="text-right font-medium">
                            ${((item.snack?.price || 0) * item.quantity).toFixed(2)}
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
    </div>
  )
}
