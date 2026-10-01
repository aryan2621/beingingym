import { Hono } from 'hono';
import { z } from 'zod';
import { Firestore } from '../firestore';
import type { AppEnv } from '../types';
import { isoDate, rangeQuery, validate } from '../validation';

const pointSchema = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    timestamp: isoDate,
});

const trackSchema = z.object({
    points: z
        .array(pointSchema)
        .min(2)
        .max(5000)
        .refine((points) => points.every((p, i) => i === 0 || points[i - 1].timestamp <= p.timestamp), {
            message: 'points must be in chronological order',
        }),
});

type Point = z.infer<typeof pointSchema>;

function haversineKm(a: Point, b: Point) {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export const tracks = new Hono<AppEnv>()
    .get('/', validate('query', rangeQuery), async (c) => {
        const { from, to } = c.req.valid('query');
        const db = new Firestore(c.env);
        return c.json(await db.list(['users', c.var.userId], 'tracks', { field: 'startedAt', from, to }));
    })
    // Recorded by the mobile app; the web app only reads tracks.
    .post('/', validate('json', trackSchema), async (c) => {
        const { points } = c.req.valid('json');
        let distanceKm = 0;
        for (let i = 1; i < points.length; i++) distanceKm += haversineKm(points[i - 1], points[i]);

        const db = new Firestore(c.env);
        const track = await db.create(['users', c.var.userId, 'tracks', crypto.randomUUID()], {
            points,
            distanceKm: Number(distanceKm.toFixed(3)),
            startedAt: points[0].timestamp,
            endedAt: points[points.length - 1].timestamp,
        });
        return c.json(track, 201);
    });
