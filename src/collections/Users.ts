import type { CollectionConfig, EmailTemplateArgs } from 'payload' // Import EmailTemplateArgs
import { admins, adminsOnly, adminsOrSelf, anyone, checkRole } from './access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    forgotPassword: {
      generateEmailHTML: (data: EmailTemplateArgs) => { // Explicitly type data
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
    useAsTitle: 'Users', // Corrected from use as
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
      name: 'name',
    },
    {
      type: 'select',
      name: 'roles',
      defaultValue: ['user'],
      hasMany: true, // Corrected from has many
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