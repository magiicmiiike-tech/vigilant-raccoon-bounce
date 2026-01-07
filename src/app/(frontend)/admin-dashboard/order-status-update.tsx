'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface OrderStatusUpdateProps {
  orderId: string
  currentStatus: string
}

export default function OrderStatusUpdate({ orderId, currentStatus }: OrderStatusUpdateProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === status) return

    setIsUpdating(true)
    setError('')

    try {
      const response = await fetch('/api/orders/update-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status: newStatus,
        }),
      })

      if (response.ok) {
        setStatus(newStatus)
        router.refresh() // Refresh the page to show updated data
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update status')
      }
    } catch (err) {
      setError('Failed to update status. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => handleStatusUpdate('pending')}
          disabled={isUpdating || status === 'pending'}
          variant={status === 'pending' ? 'default' : 'outline'}
          size="sm"
        >
          Pending
        </Button>
        <Button
          onClick={() => handleStatusUpdate('completed')}
          disabled={isUpdating || status === 'completed'}
          variant={status === 'completed' ? 'default' : 'outline'}
          size="sm"
        >
          Completed
        </Button>
        <Button
          onClick={() => handleStatusUpdate('cancelled')}
          disabled={isUpdating || status === 'cancelled'}
          variant={status === 'cancelled' ? 'destructive' : 'outline'}
          size="sm"
        >
          Cancelled
        </Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isUpdating && <div className="text-sm text-gray-500">Updating...</div>}
    </div>
  )
}
