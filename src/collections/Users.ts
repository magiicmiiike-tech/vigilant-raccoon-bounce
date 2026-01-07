import type { CollectionConfig, EmailTemplateArgs } from 'payload'
import { admins, adminsOnly, adminsOrSelf } from './access'

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
    useAsTitle: 'firstName', // Changed to firstName
    defaultColumns: ['firstName', 'lastName', 'email', 'role'],
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
      name: 'firstName',
      required: true,
    },
    {
      type: 'text',
      name: 'lastName',
      required: true,
    },
    {
      type: 'select',
      name: 'role',
      defaultValue: 'user',
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