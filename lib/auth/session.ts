import { cookies } from "next/headers";

type JwtPayload = {
  sub?: string;
  email?: string;
  exp?: number;
  [key: string]: any;
};

export interface SessionUser {
  id: string;
  email?: string;
  exp?: number;
}

function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function findAccessTokenCookieValue() {
  const cookieStore = await cookies();
  const direct = cookieStore.get("sb-access-token");
  if (direct) return direct.value;
  const authToken = cookieStore
    .getAll()
    .find((cookie) => cookie.name.endsWith("-auth-token"));
  if (authToken?.value) {
    const raw = authToken.value;
    if (raw.startsWith("base64-")) {
      try {
        const json = Buffer.from(raw.slice(7), "base64").toString("utf8");
        const parsed = JSON.parse(json);
        if (parsed?.access_token) {
          return parsed.access_token as string;
        }
      } catch {
        // ignore malformed cookie
      }
    }
  }
  const fallback = cookieStore
    .getAll()
    .find((cookie) => cookie.name.endsWith("-access-token"));
  return fallback?.value ?? null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await findAccessTokenCookieValue();
  if (!token) return null;

  const payload = decodeJwt(token);
  if (!payload?.sub) return null;

  return {
    id: payload.sub,
    email: payload.email,
    exp: payload.exp,
  };
}

