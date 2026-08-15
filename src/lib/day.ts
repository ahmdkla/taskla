/**
 * The app's "day" boundary.
 *
 * Vercel runs functions in UTC, but a habit ticked at 10pm WIB must land on
 * that same local day — otherwise streaks break at the wrong moment. Everything
 * day-shaped (habits, digests) goes through here so the boundary is consistent.
 */
const APP_TZ_OFFSET_HOURS = 7; // WIB (UTC+7)

/** Today in the app timezone, as a YYYY-MM-DD key. */
export function todayKey(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + APP_TZ_OFFSET_HOURS * 3_600_000);
  return shifted.toISOString().slice(0, 10);
}

/** Start/end of the app-timezone day, expressed as UTC instants. */
export function appDayWindow(now: Date = new Date()) {
  const key = todayKey(now);
  const [y, m, d] = key.split("-").map(Number);
  const startUtc = new Date(
    Date.UTC(y, m - 1, d) - APP_TZ_OFFSET_HOURS * 3_600_000
  );
  return { startUtc, endUtc: new Date(startUtc.getTime() + 86_400_000) };
}
