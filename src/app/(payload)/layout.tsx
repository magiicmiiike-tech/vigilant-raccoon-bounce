import '@payloadcms/next/css'
import type { ServerFunctionClient, ServerFunctionArgs } from 'payload' // Import ServerFunctionArgs
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

const serverFunction: ServerFunctionClient = async function (args: ServerFunctionArgs) { // Explicitly type args
  'use server'
  return handleServerFunctions(args)
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}