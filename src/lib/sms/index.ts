// SMS provider abstraction for Tenant TMA phone OTP delivery.
//
// STATUS: No production SMS provider is wired up yet. Set SMS_PROVIDER=twilio and the
// TWILIO_* environment variables below to enable real delivery. Until then, in
// non-production environments OTPs are generated and stored exactly as they would be in
// production, but delivery is skipped (never logged) and the backend contract can be
// exercised end-to-end by any provider implementing SmsProvider.

export interface SmsProvider {
  send(to: string, message: string): Promise<void>;
}

class TwilioSmsProvider implements SmsProvider {
  private accountSid = process.env.TWILIO_ACCOUNT_SID!;
  private authToken = process.env.TWILIO_AUTH_TOKEN!;
  private from = process.env.TWILIO_FROM_NUMBER!;

  async send(to: string, message: string): Promise<void> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const body = new URLSearchParams({ To: to, From: this.from, Body: message });
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!res.ok) {
      // Never log the response body — it can echo back the message content.
      throw new Error(`SMS provider request failed (${res.status})`);
    }
  }
}

class NoopSmsProvider implements SmsProvider {
  async send(to: string): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMS provider is not configured for production');
    }
    const redacted = to.replace(/\d(?=\d{2})/g, '*');
    console.warn(`[dev] SMS delivery skipped (no SMS_PROVIDER configured) for ${redacted}`);
  }
}

let cachedProvider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (cachedProvider) return cachedProvider;

  const provider = (process.env.SMS_PROVIDER || '').toLowerCase();
  if (provider === 'twilio') {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
      throw new Error('SMS_PROVIDER=twilio is set but TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER are missing');
    }
    cachedProvider = new TwilioSmsProvider();
  } else {
    cachedProvider = new NoopSmsProvider();
  }
  return cachedProvider;
}

export function isSmsProviderConfigured(): boolean {
  return (process.env.SMS_PROVIDER || '').toLowerCase() === 'twilio';
}
