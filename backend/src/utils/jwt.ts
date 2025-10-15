import jwt from 'jsonwebtoken';

// Validate required JWT secrets on module load
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET is not set or too short (minimum 32 characters)');
  console.error('Generate a secure secret: openssl rand -hex 64');
  process.exit(1);
}

if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
  console.error('FATAL: JWT_REFRESH_SECRET is not set or too short (minimum 32 characters)');
  console.error('Generate a secure secret: openssl rand -hex 64');
  process.exit(1);
}

// Type assertion is safe because we validated above
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
}

export function getRefreshTokenExpiry(): Date {
  const expiryMs = JWT_REFRESH_EXPIRES_IN.includes('d')
    ? parseInt(JWT_REFRESH_EXPIRES_IN) * 24 * 60 * 60 * 1000
    : parseInt(JWT_REFRESH_EXPIRES_IN) * 60 * 60 * 1000;

  return new Date(Date.now() + expiryMs);
}
