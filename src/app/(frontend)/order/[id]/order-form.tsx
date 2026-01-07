'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

interface OrderFormProps {
  snack: any
  user: any
}

export default function OrderForm({ snack, user }: OrderFormProps) {
  const [quantity, setQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const totalPrice = (snack.price * quantity).toFixed(2)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: user.id,
          items: [
            {
              snack: snack.id,
              quantity,
            },
          ],
          totalAmount: parseFloat(totalPrice),
        }),
      })

      if (response.ok) {
        router.push('/my-orders?success=true')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to place order')
      }
    } catch (err) {
      setError('Failed to place order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <label htmlFor="quantity" className="text-sm font-medium">
          Quantity:
        </label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            variant="outline"
            size="sm"
          >
            -
          </Button>
          <Input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            className="w-20 text-center"
          />
          <Button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            variant="outline"
            size="sm"
          >
            +
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Total: ${totalPrice}</h3>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Placing Order...' : 'Place Order'}
      </Button>
    </form>
  )
}
