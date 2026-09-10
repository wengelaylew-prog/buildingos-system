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

// Resolves the Authorization header value for the currently available auth method:
// live Telegram WebApp initData takes priority, otherwise a previously issued session token.
export function getTmaAuthHeader(fallbackInitData: string | null): string | null {
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.initData) return `TMA ${tg.initData}`;
  if (fallbackInitData) return `TMA ${fallbackInitData}`;

  const token = getTmaSessionToken();
  if (token) return `TMASession ${token}`;

  return null;
}

async function parseJson(res: Response) {
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Request failed');
  }
  return json.data;
}

export async function tmaAuthLoginEmail(email: string, password: string) {
  const res = await fetch('/api/v1/tma-auth/email/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJson(res);
  setTmaSessionToken(data.token);
  return data;
}

export async function tmaAuthSendOtp(phone: string) {
  const res = await fetch('/api/v1/tma-auth/phone/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return parseJson(res);
}

export async function tmaAuthVerifyOtp(phone: string, code: string) {
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
  const header = getTmaAuthHeader(null);
  try {
    await fetch('/api/v1/tma-auth/logout', {
      method: 'POST',
      headers: header ? { Authorization: header } : {},
    });
  } finally {
    setTmaSessionToken(null);
  }
}
