import type { Access, PayloadRequest } from 'payload' // Import PayloadRequest
import type { User } from '../../payload-types'

export const checkRole = (allRoles: User['roles'] = [], user?: User): boolean => {
  if (!user) return false

  // Check if user has 'admin' role and if 'admin' is among the required roles
  if (allRoles.includes('admin') && user.roles && user.roles.includes('admin')) return true

  // Check if user has any of the required roles
  return allRoles.some((role) => user.roles && user.roles.includes(role))
}

export const admins: Access = ({ req: { user } }) => checkRole(['admin'], user as User)
export const authenticated: Access = ({ req: { user } }) => !!user
export const adminsOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.roles && user.roles.includes('admin')) return true
  return {
    id: {
      equals: user.id,
    },
  }
}

export const adminsOrOwner = (ownerField: string = 'user'): Access => {
  return ({ req: { user } }: { req: PayloadRequest }) => { // Explicitly type req
    if (!user) return false
    if (user.roles && user.roles.includes('admin')) return true
    return {
      [ownerField]: {
        equals: user.id,
      },
    }
  }
}

// Export adminsOnly and anyone for other collections
export const adminsOnly: Access = ({ req: { user } }) => checkRole(['admin'], user as User);
export const anyone: Access = () => true;