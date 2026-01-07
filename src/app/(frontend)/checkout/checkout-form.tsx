'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CheckoutFormProps {
  user: any
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ user }) => {
  const { state, clearCart, getTotalPrice } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (state.items.length === 0) {
      setError('Your cart is empty')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: state.items.map((item) => ({
            snack: item.id,
            quantity: item.quantity,
          })),
          totalAmount: getTotalPrice(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to place order')
      }

      const result = await response.json()
      clearCart()
      router.push(`/my-orders?success=true&orderId=${result.doc.id}`)
    } catch (err) {
      setError('Failed to place order. Please try again.')
      console.error('Order submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (state.items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Your cart is empty</p>
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
        <div className="space-y-3">
          {state.items.map((item) => (
            <Card key={item.id} className="p-3">
              <div className="flex items-center gap-3">
                {item.image && (
                  <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image.url}
                      alt={item.image.alt || item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                  <p className="text-sm text-gray-600">
                    ${item.price.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Total */}
      <div className="flex justify-between items-center text-lg font-semibold">
        <span>Total:</span>
        <span className="text-green-600">${getTotalPrice().toFixed(2)}</span>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="pt-4">
        <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
          {isSubmitting ? 'Placing Order...' : 'Place Order'}
        </Button>
      </div>

      <div className="text-sm text-gray-500 text-center">
        <p>
          Order will be placed for: {user.firstName} {user.lastName}
        </p>
        <p>Email: {user.email}</p>
      </div>
    </form>
  )
}
