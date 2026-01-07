import { withPayload } from '@payloadcms/next/withPayload'
import { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack: (config) => {
    if (process.env.NODE_ENV === 'development') {
      config.module.rules.push({
        test: /\.(jsx|tsx)$/,
        exclude: /node_modules/,
        enforce: 'pre',
        use: '@dyad-sh/nextjs-webpack-component-tagger',
      })
    }
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Your Next.js config here
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
