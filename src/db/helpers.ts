export function newId(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

export function withTimestamps<T extends Record<string, unknown>>(data: T) {
  const ts = now();
  return {
    ...data,
    createdAt: (data.createdAt as string | undefined) ?? ts,
    updatedAt: (data.updatedAt as string | undefined) ?? ts,
  };
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toJson(value: unknown): string {
  return JSON.stringify(value ?? {});
}
