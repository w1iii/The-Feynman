import { createClient } from "../supabase/client";

let tokenPromise: Promise<string | undefined> | null = null;

function getAccessToken(): Promise<string | undefined> {
  if (!tokenPromise) {
    tokenPromise = createClient().auth.getSession().then(
      ({ data: { session } }) => session?.access_token
    );
  }
  return tokenPromise;
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, { ...options, headers });
}
