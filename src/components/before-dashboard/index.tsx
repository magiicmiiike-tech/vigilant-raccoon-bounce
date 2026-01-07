import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { SeedButton } from './seed-button'
import './index.scss'

const baseClass = 'before-dashboard'

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Welcome to your dashboard!</h4>
      </Banner>
      Add some default snacks
      <br />
      <SeedButton />
    </div>
  )
}

export default BeforeDashboard
