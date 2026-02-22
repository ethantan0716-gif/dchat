const WINDOW_MS = 10_000;
const MAX_REQUESTS = 10;

type RecordEntry = {
  count: number;
  expiresAt: number;
};

const store = new Map<string, RecordEntry>();

export function checkRateLimit(key: string) {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.expiresAt < now) {
    store.set(key, { count: 1, expiresAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (existing.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  store.set(key, existing);
  return { allowed: true, remaining: MAX_REQUESTS - existing.count };
}
