import { Hono } from 'hono';
import { z } from 'zod';
import { Firestore } from '../firestore';
import type { AppEnv } from '../types';
import { validate } from '../validation';

const profileSchema = z.object({
    name: z.string().trim().max(120).optional(),
    email: z.email().optional(),
    picture: z.url().optional(),
});

export const me = new Hono<AppEnv>()
    .get('/', async (c) => {
        const db = new Firestore(c.env);
        const user = await db.get(['users', c.var.userId]);
        return c.json(user ?? { id: c.var.userId });
    })
    // Called by the web app after login to sync the Auth0 profile.
    .put('/', validate('json', profileSchema), async (c) => {
        const db = new Firestore(c.env);
        const path = ['users', c.var.userId];
        const data = c.req.valid('json');
        const existing = await db.get(path);
        const user = await db.update(path, existing ? data : { ...data, createdAt: new Date() });
        return c.json(user);
    });
