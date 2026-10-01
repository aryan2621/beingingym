import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { Firestore } from '../firestore';
import type { AppEnv } from '../types';
import { isoDate, rangeQuery, validate } from '../validation';

const eventSchema = z
    .object({
        title: z.string().trim().min(1).max(200),
        start: isoDate,
        end: isoDate,
    })
    .refine((e) => e.start < e.end, { message: '`start` must be before `end`', path: ['end'] });

export const events = new Hono<AppEnv>()
    .get('/', validate('query', rangeQuery), async (c) => {
        const { from, to } = c.req.valid('query');
        const db = new Firestore(c.env);
        return c.json(await db.list(['users', c.var.userId], 'events', { field: 'start', from, to }));
    })
    .post('/', validate('json', eventSchema), async (c) => {
        const db = new Firestore(c.env);
        const event = await db.create(['users', c.var.userId, 'events', crypto.randomUUID()], c.req.valid('json'));
        return c.json(event, 201);
    })
    .put('/:id', validate('json', eventSchema), async (c) => {
        const db = new Firestore(c.env);
        const event = await db.update(['users', c.var.userId, 'events', c.req.param('id')], c.req.valid('json'), { mustExist: true });
        if (!event) throw new HTTPException(404, { message: 'Event not found' });
        return c.json(event);
    })
    .delete('/:id', async (c) => {
        const db = new Firestore(c.env);
        const deleted = await db.delete(['users', c.var.userId, 'events', c.req.param('id')]);
        if (!deleted) throw new HTTPException(404, { message: 'Event not found' });
        return c.body(null, 204);
    });
