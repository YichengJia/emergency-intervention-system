// Local timezone helpers.
// Default to Australia/Brisbane if the browser fails to report a timezone.
export const LOCAL_TZ =
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Brisbane';

/** Format an ISO string to local wall-clock time like "08:00 AM". */
export function formatLocalTime(
  iso: string,
  tz = LOCAL_TZ,
  opts: Intl.DateTimeFormatOptions = {}
) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: tz,
    ...opts,
  }).format(d);
}

/** True if iso falls on the same calendar day as `ref` in the given timezone. */
export function isSameLocalDay(iso: string, ref = new Date(), tz = LOCAL_TZ) {
  const fmt = (dt: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(dt);
  return fmt(new Date(iso)) === fmt(ref);
}

/** Start and end of "today" in local tz, returned as UTC ISO strings. */
export function dayBoundsISO(date = new Date(), tz = LOCAL_TZ) {
  // Materialize local date parts in tz
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(date)
    .reduce((o, p) => {
      if (p.type !== 'literal') o[p.type] = p.value;
      return o;
    }, {} as Record<string, string>);

  // Construct local-midnight Date objects in the *runtime* timezone.
  // This is acceptable in browsers, since runtime tz == user local tz.
  const startLocal = new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    0,
    0,
    0,
    0
  );
  const endLocal = new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day) + 1,
    0,
    0,
    0,
    0
  );

  return { startISO: startLocal.toISOString(), endISO: endLocal.toISOString() };
}
