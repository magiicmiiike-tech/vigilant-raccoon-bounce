'use client'

import React, { useState } from 'react'
import { Plus, Check } from 'lucide-react'

import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'
import type { CartItem } from '@/lib/cart-context'

interface AddToCartButtonProps {
  snack: {
    id: string
    name: string
    price: number
    category: string
    image?: {
      url: string
      alt?: string
    }
  }
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({ snack }) => {
  const { addItem, openCart } = useCart()
  const [isAdded, setIsAdded] = useState(false)

  const handleAddToCart = () => {
    addItem({
      id: snack.id,
      name: snack.name,
      price: snack.price,
      category: snack.category,
      image: snack.image,
    })

    setIsAdded(true)

    // Show feedback for 1 second
    setTimeout(() => {
      setIsAdded(false)
    }, 1000)

    // Optional: Open cart after adding item
    // openCart()
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAdded}
      className={isAdded ? 'bg-green-600 hover:bg-green-600' : ''}
    >
      {isAdded ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Added!
        </>
      ) : (
        <>
          <Plus className="h-4 w-4 mr-2" />
          Add to Cart
        </>
      )}
    </Button>
  )
}
