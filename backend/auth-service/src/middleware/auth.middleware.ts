import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/TokenService';
import { SessionService } from '../services/SessionService';
import { AppDataSource } from '../data-source';
import { AppSession } from '../entities/AppSession'; // Changed from Session to AppSession
import { AuthenticationError, AuthorizationError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ApiKeyService } from '../services/ApiKeyService';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      tenantId?: string;
      apiKey?: any;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    // Check if it's an API key
    if (token.startsWith('duk_')) {
      const apiKeyService = new ApiKeyService();
      const apiKey = await apiKeyService.validateApiKey(token);
      
      req.apiKey = apiKey;
      req.tenantId = apiKey.tenantId;
      req.user = {
        sub: apiKey.profileId || apiKey.tenantId, // Changed userId to profileId
        tenantId: apiKey.tenantId,
        scopes: apiKey.scopes,
        type: apiKey.profileId ? 'user' : 'tenant', // Changed userId to profileId
      };
      
      return next();
    }

    // Regular JWT token
    const payload = TokenService.verifyAccessToken(token);
    
    // Optionally, verify session validity in the database/Redis
    // This adds overhead but provides stronger revocation capabilities
    // const sessionService = new SessionService();
    // const session = await sessionService.validateSession(payload.sessionId, payload.refreshToken);
    // if (!session) {
    //   throw new AuthenticationError('Session invalidated or not found');
    // }
    
    req.user = payload;
    req.tenantId = payload.tenantId;
    
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return next(error);
    }
    next(new AuthenticationError('Invalid authentication token'));
  }
};

export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!requiredRoles.includes(req.user.role)) {
        throw new AuthorizationError(`Requires one of: ${requiredRoles.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireScope = (scopes: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user && !req.apiKey) {
        throw new AuthenticationError('Authentication required');
      }

      const userScopes = req.user?.scopes || req.apiKey?.scopes || [];
      const requiredScopes = Array.isArray(scopes) ? scopes : [scopes];
      
      const hasScope = requiredScopes.some(scope => userScopes.includes(scope));
      
      if (!hasScope) {
        throw new AuthorizationError(`Requires scope: ${requiredScopes.join(' or ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestedTenantId = req.headers['x-tenant-id'] || req.params.tenantId;
    
    if (!requestedTenantId) {
      throw new ValidationError('Tenant ID is required');
    }

    if (req.user && req.user.tenantId !== requestedTenantId) {
      throw new AuthorizationError('Cannot access this tenant');
    }

    if (req.apiKey && req.apiKey.tenantId !== requestedTenantId) {
      throw new AuthorizationError('API key not authorized for this tenant');
    }

    req.tenantId = requestedTenantId;
    next();
  } catch (error) {
    next(error);
  }
};

export const rateLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifier = req.user?.sub || req.ip;
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = req.user ? 100 : 10; // More for authenticated users

    // Simplified rate limiting - in production, use Redis
    const key = `rate_limit:${identifier}`;
    
    // This is a simplified version - implement proper Redis-based rate limiting
    logger.debug(`Rate limit check for ${identifier}`);
    
    next();
  } catch (error) {
    next(error);
  }
};