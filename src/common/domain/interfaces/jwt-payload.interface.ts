export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  roles?: string[];
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
  jti: string;
}
