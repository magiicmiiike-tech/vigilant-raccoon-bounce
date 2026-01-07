import type { CollectionConfig, EmailTemplateArgs } from 'payload'
import { admins, adminsOnly, adminsOrSelf, anyone, checkRole } from './access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    forgotPassword: {
      generateEmailHTML: (data: EmailTemplateArgs) => {
        const resetPasswordURL = `${data?.req?.payload.config.serverURL}/reset-password?token=${data?.token}`

        return `
          <!doctype html>
          <html>
            <body>
              <p>To reset your password, click on the link below:</p>
              <p><a href="${resetPasswordURL}">${resetPasswordURL}</a></p>
            </body>
          </html>
        `
      },
    },
  },
  admin: {
    useAsTitle: 'name', // Corrected from 'Users' to 'name' as per Payload best practices for title field
    defaultColumns: ['name', 'email'],
    group: 'Admin',
  },
  access: {
    read: adminsOrSelf,
    create: admins,
    update: adminsOrSelf,
    delete: adminsOnly,
  },
  fields: [
    {
      type: 'text',
      name: 'firstName', // Changed to firstName to match payload-types.ts
      required: true,
    },
    {
      type: 'text',
      name: 'lastName', // Changed to lastName to match payload-types.ts
      required: true,
    },
    {
      type: 'select',
      name: 'role', // Changed from 'roles' to 'role' (singular)
      defaultValue: 'user', // Changed to singular default value
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'User',
          value: 'user',
        },
      ],
      access: {
        read: admins,
        create: admins,
        update: admins,
      },
    },
  ],
}