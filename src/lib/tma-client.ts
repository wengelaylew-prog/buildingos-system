// Client-side helpers for the Tenant TMA authentication flow.
// Session tokens are kept in memory + sessionStorage only (never localStorage),
// so they do not persist as long-lived secrets across browser restarts.

const SESSION_KEY = 'buildingos_tma_session_token';

let memoryToken: string | null = null;

export function setTmaSessionToken(token: string | null) {
  memoryToken = token;
  try {
    if (token) sessionStorage.setItem(SESSION_KEY, token);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // sessionStorage may be unavailable in some embedded webviews; memory fallback still works.
  }
}

export function getTmaSessionToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    memoryToken = sessionStorage.getItem(SESSION_KEY);
  } catch {
    memoryToken = null;
  }
  return memoryToken;
}

// Resolves the Authorization header for the currently authenticated TMA session.
// All three login methods (Telegram / Email OTP / Phone OTP) converge on the same
// server-issued session token, so ongoing API calls only ever need this one header.
export function getTmaAuthHeader(): string | null {
  const token = getTmaSessionToken();
  return token ? `TMASession ${token}` : null;
}

async function parseJson(res: Response) {
  const json = await res.json();
  if (!res.ok || !json.success) {
    const err: any = new Error(json.message || 'Request failed');
    err.code = json.error?.code;
    throw err;
  }
  return json.data;
}

export async function tmaAuthLoginTelegram(initData: string) {
  const res = await fetch('/api/v1/tma-auth/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  });
  const data = await parseJson(res);
  setTmaSessionToken(data.token);
  return data;
}

export async function tmaAuthSendEmailOtp(email: string) {
  const res = await fetch('/api/v1/tma-auth/email/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return parseJson(res);
}

export async function tmaAuthVerifyEmailOtp(email: string, code: string) {
  const res = await fetch('/api/v1/tma-auth/email/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  const data = await parseJson(res);
  setTmaSessionToken(data.token);
  return data;
}

export async function tmaAuthSendPhoneOtp(phone: string) {
  const res = await fetch('/api/v1/tma-auth/phone/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return parseJson(res);
}

export async function tmaAuthVerifyPhoneOtp(phone: string, code: string) {
  const res = await fetch('/api/v1/tma-auth/phone/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });
  const data = await parseJson(res);
  setTmaSessionToken(data.token);
  return data;
}

export async function tmaAuthLogout() {
  const header = getTmaAuthHeader();
  try {
    await fetch('/api/v1/tma-auth/logout', {
      method: 'POST',
      headers: header ? { Authorization: header } : {},
    });
  } finally {
    setTmaSessionToken(null);
  }
}
