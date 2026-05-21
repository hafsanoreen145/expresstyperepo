/**
 * TypeScript Type Definitions
 * Centralized interfaces and types
 */

export interface LinkedInProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: {
    displayImage?: string;
  };
  email?: string;
}

// OpenID Connect userinfo response format
export interface LinkedInUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale?: {
    country: string;
    language: string;
  };
}

export interface LinkedInTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface AuthSession {
  userId: string;
  token: string;
  email: string;
  name: string;
  avatar?: string;
  linkedinId: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  linkedinId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TokenPayload {
  userId: string;
  email?: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

