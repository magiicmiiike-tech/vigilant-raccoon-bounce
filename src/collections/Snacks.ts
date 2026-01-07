import type { CollectionConfig } from 'payload'
import { admins, adminsOnly, anyone } from './access'

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
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false, // Making image optional as imageUrl can also be used
    },
    {
      name: 'imageUrl', // Added imageUrl field
      type: 'text',
      label: 'Image URL (for external images)',
      admin: {
        description: 'Use this for placeholder images or external image URLs. Either image or imageUrl should be provided.',
      },
    },
    {
      name: 'available',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Chips', value: 'chips' },
        { label: 'Candy', value: 'candy' },
        { label: 'Cookies', value: 'cookies' },
        { label: 'Nuts', value: 'nuts' },
        { label: 'Crackers', value: 'crackers' },
        { label: 'Drinks', value: 'drinks' },
      ],
      required: true,
    },
  ],
}