import { createClient } from "../supabase/client";

let cachedToken: string | null = null;
let tokenExpiry = 0;

const TOKEN_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

function getAccessToken(): Promise<string | undefined> {
  const now = Date.now();
  if (!cachedToken || now >= tokenExpiry) {
    const promise = createClient().auth.getSession().then(
      ({ data: { session } }) => {
        cachedToken = session?.access_token ?? null;
        // Supabase JWTs expire in 1 hour; refresh at 55 min
        tokenExpiry = Date.now() + 55 * 60 * 1000;
        return cachedToken ?? undefined;
      }
    );
    return promise;
  }
  return Promise.resolve(cachedToken ?? undefined);
}

export function clearTokenCache() {
  cachedToken = null;
  tokenExpiry = 0;
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, { ...options, headers });
}
