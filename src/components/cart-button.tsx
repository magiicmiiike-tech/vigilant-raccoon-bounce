'use client'

import React from 'react'
import { ShoppingCart } from 'lucide-react'

import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'

export const CartButton: React.FC = () => {
  const { toggleCart, getTotalItems } = useCart()
  const totalItems = getTotalItems()

  return (
    <Button variant="outline" size="sm" onClick={toggleCart} className="relative">
      <ShoppingCart className="h-4 w-4" />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {totalItems}
        </span>
      )}
      <span className="ml-2 hidden sm:inline">Cart</span>
    </Button>
  )
}
