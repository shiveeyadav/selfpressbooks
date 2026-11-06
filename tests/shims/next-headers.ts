// TEST-ONLY in-memory cookie jar standing in for next/headers.
const jar = new Map<string, string>();
export function cookies() {
  return {
    get: (n: string) => (jar.has(n) ? { value: jar.get(n)! } : undefined),
    set: (n: string, v: string) => void jar.set(n, v),
    delete: (n: string) => void jar.delete(n),
  };
}
export function headers() { return { get: () => null }; }
