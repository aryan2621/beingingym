import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { Firestore } from '../firestore';
import { EXERCISES, type AppEnv } from '../types';
import { isoDate, rangeQuery, validate } from '../validation';

const sessionSchema = z.object({
    exercise: z.enum(EXERCISES),
    // Seconds; capped at 24h to reject obviously broken timers.
    duration: z.number().int().positive().max(86_400),
    date: isoDate.optional(),
});

export const sessions = new Hono<AppEnv>()
    .get('/', validate('query', rangeQuery), async (c) => {
        const { from, to } = c.req.valid('query');
        const db = new Firestore(c.env);
        return c.json(await db.list(['users', c.var.userId], 'sessions', { field: 'date', from, to }));
    })
    .post('/', validate('json', sessionSchema), async (c) => {
        const { date, ...rest } = c.req.valid('json');
        const db = new Firestore(c.env);
        const session = await db.create(['users', c.var.userId, 'sessions', crypto.randomUUID()], { ...rest, date: date ?? new Date() });
        return c.json(session, 201);
    })
    .delete('/:id', async (c) => {
        const db = new Firestore(c.env);
        const deleted = await db.delete(['users', c.var.userId, 'sessions', c.req.param('id')]);
        if (!deleted) throw new HTTPException(404, { message: 'Session not found' });
        return c.body(null, 204);
    });
