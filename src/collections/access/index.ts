import type { Access } from 'payload'
import type { User } from '../../payload-types'

// Utility function to check if user has specific roles
export const checkRole = (allRoles: User['role'][] = [], user: User | null = null): boolean => {
  if (user) {
    if (allRoles.some((role) => user?.role === role)) {
      return true
    }
  }
  return false
}

// Common access patterns
export const anyone: Access = () => true

export const admins: Access = ({ req: { user } }) => checkRole(['admin'], user)

export const adminsOnly = ({ req: { user } }: { req: { user: User | null } }) =>
  checkRole(['admin'], user)

export const authenticated: Access = ({ req: { user } }) => !!user

export const adminsOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (checkRole(['admin'], user)) return true
  return {
    id: {
      equals: user.id,
    },
  }
}

export const adminsOrOwner = (ownerField: string = 'user'): Access => {
  return ({ req: { user } }) => {
    if (!user) return false
    if (checkRole(['admin'], user)) return true
    return {
      [ownerField]: {
        equals: user.id,
      },
    }
  }
}
