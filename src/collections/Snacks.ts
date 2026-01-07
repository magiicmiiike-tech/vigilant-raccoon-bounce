import type { CollectionConfig } from 'payload'
import { admins, adminsOnly, anyone } from './access'

export const Snacks: CollectionConfig = {
  slug: 'snacks',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: anyone, // Anyone can read snacks (for public viewing)
    create: admins,
    update: admins,
    delete: admins,
    admin: adminsOnly,
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
      required: true,
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'imageUrl',
      type: 'text',
      required: false,
      admin: {
        description:
          'Use this for placeholder images or external image URLs. Either image or imageUrl should be provided.',
      },
    },
    {
      name: 'available',
      type: 'checkbox',
      defaultValue: true,
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
