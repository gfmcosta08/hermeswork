const seen = new Map<string, number>();

export function isReplay(eventId: string, ttlMs = 5 * 60 * 1000): boolean {
  const now = Date.now();

  for (const [key, value] of seen) {
    if (value < now) {
      seen.delete(key);
    }
  }

  if (seen.has(eventId)) {
    return true;
  }

  seen.set(eventId, now + ttlMs);
  return false;
}
