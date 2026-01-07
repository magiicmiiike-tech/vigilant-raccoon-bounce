import type { CollectionConfig } from 'payload'
import { admins, adminsOnly, anyone } from './access' // Import adminsOnly and anyone

export const Snacks: CollectionConfig = {
  slug: 'snacks',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'price', 'category'],
    group: 'Shop',
  },
  access: {
    read: anyone,
    create: admins,
    update: admins,
    delete: adminsOnly,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'price',
      type: 'number',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Sweet', value: 'sweet' },
        { label: 'Savory', value: 'savory' },
        { label: 'Drink', value: 'drink' },
      ],
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
  ],
}