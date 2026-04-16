export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export async function apiFetch<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const err = (await res.json()) as { error?: string };
      if (err?.error) message = err.error;
    } catch {
      // noop
    }
    throw new Error(message);
  }

  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}
