export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  tenantId: string;
  metadata?: Record<string, any>;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenantId: string;
  deviceInfo?: DeviceInfo;
}

export interface DeviceInfo {
  userAgent?: string;
  ipAddress?: string;
  deviceType?: string;
  os?: string;
  browser?: string;
}

export interface AuthResponse {
  user: UserResponse;
  tokens: Tokens;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  tenantId: string;
  isActive: boolean;
  mfaEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  TENANT_ADMIN = 'tenant_admin',
  USER = 'user',
  AGENT = 'agent',
  VIEWER = 'viewer',
}

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface ApiKeyPayload {
  sub: string;
  tenantId: string;
  scopes: string[];
  type: 'user' | 'tenant';
}

export interface PasswordResetRequest {
  email: string;
  tenantId: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
  tenantId: string;
}

export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
}

export interface MfaVerifyRequest {
  token: string;
}

export interface SessionInfo {
  id: string;
  userAgent?: string;
  ipAddress?: string;
  deviceType?: string;
  lastActive: Date;
  createdAt: Date;
}