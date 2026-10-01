// PostgREST returns at most 1,000 rows per request — page through all of them.
const PAGE = 1000;
const MAX_PAGES = 100; // safety stop (100k rows)

export async function fetchAll<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  make: (from: number, to: number) => PromiseLike<{ data: any; error: { message: string } | null }>
): Promise<T[]> {
  const out: T[] = [];
  for (let p = 0; p < MAX_PAGES; p++) {
    const { data, error } = await make(p * PAGE, p * PAGE + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}
