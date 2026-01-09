import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    role: string;
    sessionId?: string;
  };
}

export interface ServiceError extends Error {
  statusCode?: number;
  code?: string;
}
