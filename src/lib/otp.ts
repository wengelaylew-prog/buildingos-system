import crypto from 'crypto';

const OTP_LENGTH = 6;

// OTP hashes use an HMAC pepper rather than a full KDF: codes are short-lived,
// single-use, and already rate/attempt-limited, so HMAC-SHA256 is sufficient
// and keeps verification fast under brute-force attempt limits.
function getPepper(): string {
  const secret = process.env.OTP_HASH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('OTP_HASH_SECRET is not configured');
  }
  return 'dev-only-otp-pepper-not-for-production';
}

export function generateOtp(): string {
  const code = crypto.randomInt(0, 1_000_000);
  return code.toString().padStart(OTP_LENGTH, '0');
}

export function hashOtp(code: string): string {
  return crypto.createHmac('sha256', getPepper()).update(code).digest('hex');
}

export function verifyOtpHash(code: string, hash: string): boolean {
  const candidate = Buffer.from(hashOtp(code), 'hex');
  const stored = Buffer.from(hash, 'hex');
  if (candidate.length !== stored.length) return false;
  return crypto.timingSafeEqual(candidate, stored);
}
