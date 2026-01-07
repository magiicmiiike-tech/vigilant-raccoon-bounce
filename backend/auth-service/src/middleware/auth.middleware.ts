import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/TokenService';
import { SessionService } from '../services/SessionService';
import { AppDataSource } from '../data-source';
import { Session } from '../entities/Session';
import { AuthenticationError, AuthorizationError, ValidationError } from '../utils/errors'; // Import ValidationError
import { logger } from '../utils/logger';
import { ApiKeyService } from '../services/ApiKeyService'; // Import ApiKeyService

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
        sub: apiKey.userId || apiKey.tenantId,
        tenantId: apiKey.tenantId,
        scopes: apiKey.scopes,
        type: apiKey.userId ? 'user' : 'tenant',
      };
      
      return next();
    }

    // Regular JWT token
    const payload = TokenService.verifyAccessToken(token);
    
    // Check if session is still valid (optional, adds overhead)
    // In production, you might want to check Redis for blacklisted tokens
    
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