// Recursively converts Prisma Decimal values (and anything else with a
// `.toNumber()` method) into plain numbers so server-fetched data can cross
// the RSC boundary into client components.
export function serializeDecimals<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) {
    return value.map((v) => serializeDecimals(v)) as unknown as T;
  }
  if (typeof value === "object") {
    const asDecimal = value as { toNumber?: () => number };
    if (typeof asDecimal.toNumber === "function") {
      return asDecimal.toNumber() as unknown as T;
    }
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([key, val]) => [key, serializeDecimals(val)] as const,
    );
    return Object.fromEntries(entries) as T;
  }
  return value;
}
