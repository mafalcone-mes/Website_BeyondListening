import "server-only";

export const USER_AGENT = "BeyondListening/0.1 (song stories archive; local prototype)";

/** JSON GET with a timeout. Returns null on any network/HTTP error. */
export async function getJson<T>(url: string, timeoutMs = 6000): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** "1977-02-04" → 1977 */
export function yearOf(date: string | null | undefined): number | null {
  const y = Number(String(date ?? "").slice(0, 4));
  return y >= 1900 && y <= 2100 ? y : null;
}
