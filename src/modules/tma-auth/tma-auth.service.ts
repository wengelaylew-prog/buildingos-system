import { db } from '../../db/index.ts';
import { users, tenants, otpCodes } from '../../db/schema.ts';
import { eq, and, gt, desc, isNull, isNotNull, sql } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../../lib/password.ts';
import { generateOtp, hashOtp, verifyOtpHash } from '../../lib/otp.ts';
import { getSmsProvider } from '../../lib/sms/index.ts';
import { createTmaSession, revokeTmaSession } from '../../lib/tma-session.ts';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const OTP_MAX_PER_HOUR = 5;

// Generic, non-enumerating error messages — never reveal whether an email/phone exists.
const INVALID_CREDENTIALS = 'Invalid email or password';
const INVALID_OTP = 'Invalid or expired verification code';

function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return (phone || '').trim().replace(/[^\d+]/g, '');
}

async function getActiveTenantForUser(userId: string) {
  return (
    (await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.userId, userId), eq(tenants.isDeleted, false))))[0] || null
  );
}

// Constant-shape dummy verification so a nonexistent email takes the same code path/latency
// as a real one that fails password comparison.
const DUMMY_HASH = hashPassword('not-a-real-password-used-only-for-timing-normalization');

export class TmaAuthService {
  static async loginWithEmail(rawEmail: string, password: string) {
    const email = normalizeEmail(rawEmail);
    if (!email || !password) throw new Error(INVALID_CREDENTIALS);

    const candidates = await db
      .select()
      .from(users)
      .where(and(sql`lower(${users.email}) = ${email}`, isNotNull(users.passwordHash)));

    const user = candidates[0];

    if (!user || !user.passwordHash) {
      verifyPassword(password, DUMMY_HASH);
      throw new Error(INVALID_CREDENTIALS);
    }

    const ok = verifyPassword(password, user.passwordHash);
    if (!ok || !user.isActive) throw new Error(INVALID_CREDENTIALS);

    const tenant = await getActiveTenantForUser(user.id);
    if (!tenant) throw new Error(INVALID_CREDENTIALS);

    const session = await createTmaSession(user.id, 'EMAIL');
    return { token: session.token, expiresAt: session.expiresAt };
  }

  static async sendPhoneOtp(rawPhone: string, ip?: string) {
    const phone = normalizePhone(rawPhone);
    if (!phone || phone.length < 8) throw new Error('Invalid phone number');

    const recentCodes = await db
      .select()
      .from(otpCodes)
      .where(and(eq(otpCodes.phone, phone), gt(otpCodes.createdAt, new Date(Date.now() - 60 * 60 * 1000))))
      .orderBy(desc(otpCodes.createdAt));

    if (recentCodes.length > 0 && Date.now() - recentCodes[0].createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      throw new Error('Please wait before requesting another code');
    }
    if (recentCodes.length >= OTP_MAX_PER_HOUR) {
      throw new Error('Too many verification requests. Please try again later.');
    }

    // Response is identical whether or not the phone maps to an account, to avoid enumeration.
    const genericResult = { sent: true };

    const user = (await db.select().from(users).where(eq(users.phone, phone)))[0];
    if (!user || !user.isActive) return genericResult;

    const tenant = await getActiveTenantForUser(user.id);
    if (!tenant) return genericResult;

    const code = generateOtp();
    await db.insert(otpCodes).values({
      phone,
      userId: user.id,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      requestIp: ip,
    });

    const provider = getSmsProvider();
    await provider.send(phone, `Your BuildingOS verification code is ${code}. It expires in 5 minutes.`);

    return genericResult;
  }

  static async verifyPhoneOtp(rawPhone: string, code: string) {
    const phone = normalizePhone(rawPhone);
    if (!phone || !code) throw new Error(INVALID_OTP);

    const candidate = (
      await db
        .select()
        .from(otpCodes)
        .where(and(eq(otpCodes.phone, phone), isNull(otpCodes.consumedAt)))
        .orderBy(desc(otpCodes.createdAt))
    )[0];

    if (!candidate) throw new Error(INVALID_OTP);
    if (candidate.expiresAt.getTime() < Date.now()) throw new Error(INVALID_OTP);
    if (candidate.attempts >= candidate.maxAttempts) throw new Error('Too many attempts. Please request a new code.');

    const isValid = verifyOtpHash(code, candidate.codeHash);
    if (!isValid) {
      // Atomic increment avoids losing concurrent attempt counts.
      await db
        .update(otpCodes)
        .set({ attempts: sql`${otpCodes.attempts} + 1` })
        .where(eq(otpCodes.id, candidate.id));
      throw new Error(INVALID_OTP);
    }

    // Atomically consume: only succeeds if no concurrent request has already consumed this
    // row, closing the TOCTOU window between the SELECT above and this UPDATE.
    const consumed = await db
      .update(otpCodes)
      .set({ consumedAt: new Date() })
      .where(and(eq(otpCodes.id, candidate.id), isNull(otpCodes.consumedAt)))
      .returning();

    if (consumed.length === 0) throw new Error(INVALID_OTP);

    if (!candidate.userId) throw new Error(INVALID_OTP);
    const user = (await db.select().from(users).where(eq(users.id, candidate.userId)))[0];
    if (!user || !user.isActive) throw new Error(INVALID_OTP);

    const tenant = await getActiveTenantForUser(user.id);
    if (!tenant) throw new Error(INVALID_OTP);

    const session = await createTmaSession(user.id, 'PHONE');
    return { token: session.token, expiresAt: session.expiresAt };
  }

  static async logout(token: string) {
    await revokeTmaSession(token);
  }
}
