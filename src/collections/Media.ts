import type { CollectionConfig } from 'payload'
import { admins, adminsOnly, anyone } from './access' // Import adminsOnly and anyone

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: anyone,
    create: admins,
    update: admins,
    delete: adminsOnly,
  },
  upload: {
    staticDir: './media',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}