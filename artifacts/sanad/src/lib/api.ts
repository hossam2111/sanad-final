/* Authenticated fetch for everything outside the generated API client.
   The API rejects any /api request without a Bearer token (401), so raw
   fetch calls silently render features empty — always go through apiFetch. */

export function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("sanad_jwt") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(input, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers ?? {}) },
  });

  // Handle unauthorized responses system-wide
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sanad_jwt");
      window.location.href = "/login";
    }
  }

  return response;
}
