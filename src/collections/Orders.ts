import type { CollectionConfig } from 'payload'
import { admins, adminsOnly, adminsOrOwner, authenticated } from './access' // Import adminsOnly

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['id', 'user', 'total', 'status'],
    group: 'Shop',
  },
  access: {
    read: adminsOrOwner(),
    create: authenticated,
    update: adminsOnly,
    delete: adminsOnly,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'snack',
          type: 'relationship',
          relationTo: 'snacks',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
        },
      ],
    },
    {
      name: 'total',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'pending',
      required: true,
    },
  ],
}