import { withPayload } from '@payloadcms/next/withPayload'
import { NextConfig } from 'next'
import { Configuration as WebpackConfig } from 'webpack' // Import WebpackConfig type

const nextConfig: NextConfig = {
  webpack: (config: WebpackConfig) => { // Explicitly type config parameter
    if (process.env.NODE_ENV === 'development') {
      config.watchOptions = {
        ignored: /node_modules/,
      }
    }
    return config
  },
}

export default withPayload(nextConfig)