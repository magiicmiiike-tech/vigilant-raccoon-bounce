import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import { CheckoutForm } from './checkout-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function CheckoutPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/">← Back to Shopping</Link>
        </Button>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Checkout</CardTitle>
            </CardHeader>
            <CardContent>
              <CheckoutForm user={user} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
