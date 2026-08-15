/**
 * Habit progress model.
 *
 * Milestones are measured in COMPLETIONS (not calendar days): the 14th, 21st
 * and 40th time you do the habit are the three checkpoints. Missed days don't
 * slow the count — instead each stage carries a budget of 3 "freezes"; spending
 * a 4th miss inside a stage restarts that stage (progress falls back to the
 * stage floor) while every badge already earned is kept forever.
 *
 * Everything here is derived from the append-only entry log, so a stage
 * restart can never leave a stored counter out of sync with reality.
 */

export const GRACE_PER_STAGE = 3;

export type StageDef = {
  stage: 1 | 2 | 3;
  /** Completion count that completes this stage. */
  target: number;
  /** Completion count this stage starts from (where a restart lands). */
  floor: number;
  title: string;
  blurb: string;
};

export const STAGES: StageDef[] = [
  {
    stage: 1,
    target: 14,
    floor: 0,
    title: "Success 1",
    blurb: "Two weeks in — the hardest part is behind you.",
  },
  {
    stage: 2,
    target: 21,
    floor: 14,
    title: "Success 2",
    blurb: "Three weeks. It's starting to feel automatic.",
  },
  {
    stage: 3,
    target: 40,
    floor: 21,
    title: "Success 3",
    blurb: "Forty days. This is a habit now.",
  },
];

export const FINAL_TARGET = STAGES[STAGES.length - 1].target;

export type HabitProgress = {
  /** Completions counting toward the current milestone. */
  completions: number;
  /** Every completion ever logged (never rolls back). */
  totalCompletions: number;
  /** 1-3 while in progress, null once all stages are done. */
  stage: 1 | 2 | 3 | null;
  stageDef: StageDef | null;
  /** Misses spent inside the current stage attempt. */
  missesInStage: number;
  freezesLeft: number;
  /** Stages whose badge has been earned (kept through restarts). */
  earnedStages: number[];
  /** Date each badge was earned, keyed by stage. */
  earnedOn: Record<number, string>;
  /** How many times a stage restarted because grace ran out. */
  restarts: number;
  currentStreak: number;
  bestStreak: number;
  /** 0-1 completion rate across elapsed days. */
  consistency: number;
  daysTracked: number;
  isComplete: boolean;
  doneToday: boolean;
  /** Progress within the current stage, 0-1. */
  stageProgress: number;
};

export function toDayKey(date: Date): string {
  // Entries are stored as @db.Date, which Prisma hands back as UTC midnight —
  // read the UTC parts so the key doesn't shift under a local timezone.
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dayKeyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDayKey(key: string, days: number): string {
  const date = dayKeyToDate(key);
  date.setUTCDate(date.getUTCDate() + days);
  return toDayKey(date);
}

export function stageForCompletions(completions: number): StageDef | null {
  return STAGES.find((s) => completions < s.target) ?? null;
}

/**
 * Walks every day from the start date to today, applying completions, grace
 * spending and stage restarts in order.
 *
 * @param entryKeys day keys (YYYY-MM-DD) on which the habit was completed
 * @param startKey  day the habit began being tracked
 * @param todayKey  today in the user's timezone
 */
export function computeProgress(
  entryKeys: string[],
  startKey: string,
  todayKey: string
): HabitProgress {
  const done = new Set(entryKeys);

  let completions = 0;
  let stageIndex = 0; // index into STAGES
  let misses = 0;
  let restarts = 0;
  const earnedStages: number[] = [];
  const earnedOn: Record<number, string> = {};

  // Walk day by day. Today is never counted as a miss — the day isn't over.
  let cursor = startKey;
  let daysTracked = 0;
  const guard = 5000; // safety bound against a bad start date
  let steps = 0;

  while (cursor <= todayKey && steps < guard) {
    steps += 1;
    daysTracked += 1;

    if (done.has(cursor)) {
      completions += 1;

      const current = STAGES[stageIndex];
      if (current && completions >= current.target) {
        if (!earnedStages.includes(current.stage)) {
          earnedStages.push(current.stage);
          earnedOn[current.stage] = cursor;
        }
        stageIndex += 1;
        misses = 0; // fresh grace budget for the next stage
      }
    } else if (cursor < todayKey) {
      misses += 1;
      if (misses > GRACE_PER_STAGE) {
        const current = STAGES[stageIndex];
        if (current) {
          // Restart the current stage: fall back to its floor, keep badges.
          completions = current.floor;
          restarts += 1;
        }
        misses = 0;
      }
    }

    cursor = addDayKey(cursor, 1);
  }

  const stageDef = STAGES[stageIndex] ?? null;
  const isComplete = stageDef === null;

  const { currentStreak, bestStreak } = computeStreaks(done, todayKey);

  return {
    completions,
    totalCompletions: done.size,
    stage: stageDef ? stageDef.stage : null,
    stageDef,
    missesInStage: misses,
    freezesLeft: Math.max(0, GRACE_PER_STAGE - misses),
    earnedStages,
    earnedOn,
    restarts,
    currentStreak,
    bestStreak,
    consistency: daysTracked > 0 ? done.size / daysTracked : 0,
    daysTracked,
    isComplete,
    doneToday: done.has(todayKey),
    stageProgress: stageDef
      ? Math.min(
          1,
          Math.max(
            0,
            (completions - stageDef.floor) / (stageDef.target - stageDef.floor)
          )
        )
      : 1,
  };
}

function computeStreaks(done: Set<string>, todayKey: string) {
  // Current streak counts back from today, or from yesterday if today is still
  // pending — an unfinished day shouldn't look like a broken streak.
  let anchor = done.has(todayKey) ? todayKey : addDayKey(todayKey, -1);
  let currentStreak = 0;
  if (done.has(anchor)) {
    while (done.has(anchor)) {
      currentStreak += 1;
      anchor = addDayKey(anchor, -1);
    }
  }

  const sorted = Array.from(done).sort();
  let bestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of sorted) {
    run = prev && addDayKey(prev, 1) === key ? run + 1 : 1;
    if (run > bestStreak) bestStreak = run;
    prev = key;
  }

  return { currentStreak, bestStreak };
}

/** Day keys for a heatmap grid ending today, aligned so each column is a week. */
export function heatmapDays(todayKey: string, weeks: number): string[] {
  const today = dayKeyToDate(todayKey);
  // End the grid on the Saturday of the current week so columns stay aligned.
  const endPad = 6 - today.getUTCDay();
  const endKey = addDayKey(todayKey, endPad);
  const total = weeks * 7;
  const startKey = addDayKey(endKey, -(total - 1));

  const days: string[] = [];
  let cursor = startKey;
  for (let i = 0; i < total; i += 1) {
    days.push(cursor);
    cursor = addDayKey(cursor, 1);
  }
  return days;
}
