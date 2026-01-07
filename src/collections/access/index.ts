import type { Access, PayloadRequest } from 'payload'
import type { User } from '../../payload-types'

export const checkRole = (allRoles: User['role'][] = [], user?: User): boolean => {
  if (!user) return false

  // Check if user has 'admin' role and if 'admin' is among the required roles
  if (allRoles.includes('admin') && user.role && user.role.includes('admin')) return true

  // Check if user has any of the required roles
  return allRoles.some((role) => user.role && user.role.includes(role))
}

export const admins: Access = ({ req: { user } }: { req: PayloadRequest }) => checkRole(['admin'], user as User)
export const authenticated: Access = ({ req: { user } }: { req: PayloadRequest }) => !!user
export const adminsOrSelf: Access = ({ req: { user } }: { req: PayloadRequest }) => {
  if (!user) return false
  if (user.role && user.role.includes('admin')) return true
  return {
    id: {
      equals: user.id,
    },
  }
}

export const adminsOrOwner = (ownerField: string = 'user'): Access => {
  return ({ req: { user } }: { req: PayloadRequest }) => {
    if (!user) return false
    if (user.role && user.role.includes('admin')) return true
    return {
      [ownerField]: {
        equals: user.id,
      },
    }
  }
}

// Export adminsOnly and anyone for other collections
export const adminsOnly: Access = ({ req: { user } }: { req: PayloadRequest }) => checkRole(['admin'], user as User);
export const anyone: Access = () => true;