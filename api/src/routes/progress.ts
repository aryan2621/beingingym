import { Hono } from 'hono';
import { z } from 'zod';
import { Firestore } from '../firestore';
import { EXERCISES, type AppEnv, type Exercise } from '../types';
import { validate } from '../validation';

const progressQuery = z.object({
    range: z.enum(['Daily', 'Weekly', 'Monthly']).default('Daily'),
    // Same sign as JS `Date#getTimezoneOffset()` (IST = -330), so buckets follow the user's local days.
    tzOffset: z.coerce.number().int().min(-840).max(840).default(0),
});

type Range = z.infer<typeof progressQuery>['range'];

const BUCKET_COUNT: Record<Range, number> = { Daily: 14, Weekly: 12, Monthly: 12 };

// All bucket math runs on "shifted" dates whose UTC fields equal the user's local wall clock.
function bucketStart(range: Range, local: Date): Date {
    const d = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
    if (range === 'Weekly') d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // back to Monday
    if (range === 'Monthly') d.setUTCDate(1);
    return d;
}

function stepBack(range: Range, d: Date, n: number): Date {
    const r = new Date(d);
    if (range === 'Daily') r.setUTCDate(r.getUTCDate() - n);
    if (range === 'Weekly') r.setUTCDate(r.getUTCDate() - 7 * n);
    if (range === 'Monthly') r.setUTCMonth(r.getUTCMonth() - n);
    return r;
}

const bucketKey = (range: Range, d: Date) => d.toISOString().slice(0, range === 'Monthly' ? 7 : 10);

export const progress = new Hono<AppEnv>().get('/', validate('query', progressQuery), async (c) => {
    const { range, tzOffset } = c.req.valid('query');
    const shift = tzOffset * 60_000;

    const current = bucketStart(range, new Date(Date.now() - shift));
    const first = stepBack(range, current, BUCKET_COUNT[range] - 1);

    const buckets = new Map<string, { bucket: string; seconds: number; sessions: number }>();
    for (let i = BUCKET_COUNT[range] - 1; i >= 0; i--) {
        const key = bucketKey(range, stepBack(range, current, i));
        buckets.set(key, { bucket: key, seconds: 0, sessions: 0 });
    }
    const byExercise = new Map<Exercise, number>(EXERCISES.map((e) => [e, 0]));

    const db = new Firestore(c.env);
    const from = new Date(first.getTime() + shift);
    const sessions = await db.list(['users', c.var.userId], 'sessions', { field: 'date', from }, 5000);

    for (const s of sessions) {
        const duration = Number(s.duration) || 0;
        const local = new Date(new Date(String(s.date)).getTime() - shift);
        const bucket = buckets.get(bucketKey(range, bucketStart(range, local)));
        if (bucket) {
            bucket.seconds += duration;
            bucket.sessions += 1;
        }
        const exercise = s.exercise as Exercise;
        if (byExercise.has(exercise)) byExercise.set(exercise, byExercise.get(exercise)! + duration);
    }

    const series = [...buckets.values()];
    return c.json({
        range,
        from: from.toISOString(),
        totalSeconds: series.reduce((sum, b) => sum + b.seconds, 0),
        sessionCount: sessions.length,
        series,
        byExercise: [...byExercise].map(([exercise, seconds]) => ({ exercise, seconds })),
    });
});
