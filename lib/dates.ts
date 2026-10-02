// Date helpers that use the user's LOCAL calendar day.
//
// Never use `date.toISOString().slice(0, 10)` to turn a local date into YYYY-MM-DD: toISOString() converts to UTC,
// so in Sri Lanka (UTC+5:30) local midnight on 30 April becomes "2026-04-29" — month-end dates came out a day early,
// month-start dates a day early too, and "today" was yesterday before 5:30 am.

const pad = (n: number) => String(n).padStart(2, '0');

/** YYYY-MM-DD for the given Date, in local time. */
export const localISODate = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Today's local date as YYYY-MM-DD. */
export const todayISO = (): string => localISODate(new Date());
