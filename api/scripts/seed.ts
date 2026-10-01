/**
 * Seeds sample data (practise sessions, routes and goals) into one user's Firestore account,
 * so the read-only web app has something to show before the mobile app exists.
 *
 *   npm run seed -- --email you@example.com          # user must have logged in on the web once
 *   npm run seed -- --sub "google-oauth2|1234"       # or pass the Auth0 user id directly
 *   npm run seed -- --email you@example.com --clear  # remove only the seeded documents
 *
 * Options: --days 90 (history length), --lat 28.6129 --lng 77.2295 (route start point).
 * Credentials come from api/.dev.vars; nothing secret is printed.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { Firestore } from '../src/firestore';
import { EXERCISES, type Bindings } from '../src/types';

const { values: args } = parseArgs({
    options: {
        email: { type: 'string' },
        sub: { type: 'string' },
        clear: { type: 'boolean', default: false },
        days: { type: 'string', default: '90' },
        lat: { type: 'string', default: '28.6129' },
        lng: { type: 'string', default: '77.2295' },
    },
});

function loadDevVars(): Bindings {
    const file = readFileSync(resolve(import.meta.dirname, '../.dev.vars'), 'utf8');
    const vars: Record<string, string> = {};
    for (const line of file.split('\n')) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!match) continue;
        vars[match[1]] = match[2].replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    }
    for (const key of ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY']) {
        if (!vars[key]) throw new Error(`${key} is missing in api/.dev.vars`);
    }
    return vars as unknown as Bindings;
}

const db = new Firestore(loadDevVars());
const COLLECTIONS = ['sessions', 'tracks', 'events'] as const;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

function atLocalTime(daysFromToday: number, hour: number, minute = 0) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    d.setHours(hour, minute, 0, 0);
    return d;
}

/** Runs async jobs a few at a time to stay well under Firestore's write limits. */
async function inBatches<T>(items: T[], size: number, fn: (item: T) => Promise<unknown>) {
    for (let i = 0; i < items.length; i += size) {
        await Promise.all(items.slice(i, i + size).map(fn));
    }
}

async function resolveUserId(): Promise<string> {
    if (args.sub) return args.sub;
    if (!args.email) throw new Error('Pass --email you@example.com or --sub <auth0 user id>');
    const users = await db.findEqual([], 'users', 'email', args.email, 2);
    if (users.length === 0) {
        throw new Error(`No user with email ${args.email}. Log in on the web app once so your profile is saved, then retry.`);
    }
    return users[0].id;
}

function makeSessions(days: number) {
    const sessions: Record<string, unknown>[] = [];
    for (let day = -days + 1; day <= 0; day++) {
        // Roughly 4 workouts a week, sometimes two in a day.
        if (Math.random() > 0.6) continue;
        const count = Math.random() < 0.2 ? 2 : 1;
        for (let i = 0; i < count; i++) {
            const date = atLocalTime(day, randInt(6, 20), randInt(0, 59));
            if (date > new Date()) continue;
            sessions.push({ exercise: pick(EXERCISES), duration: randInt(10, 60) * 60, date, seeded: true });
        }
    }
    return sessions;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function makeTracks(count: number, center: { lat: number; lng: number }) {
    const tracks: Record<string, unknown>[] = [];
    for (let i = 0; i < count; i++) {
        const startedAt = atLocalTime(-randInt(1, 30), randInt(6, 8), randInt(0, 59));
        const running = Math.random() < 0.5;
        const kmPerStep = (running ? 10 : 5.5) * (30 / 3600); // a point every 30 seconds
        let heading = rand(0, 2 * Math.PI);
        let lat = center.lat + rand(-0.01, 0.01);
        let lng = center.lng + rand(-0.01, 0.01);
        const points = [];
        for (let step = 0, n = randInt(40, 90); step < n; step++) {
            points.push({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)), timestamp: new Date(startedAt.getTime() + step * 30_000) });
            heading += rand(-0.35, 0.35);
            const km = kmPerStep * rand(0.8, 1.2);
            lat += (km / 111.32) * Math.cos(heading);
            lng += (km / (111.32 * Math.cos(toRad(lat)))) * Math.sin(heading);
        }
        let distanceKm = 0;
        for (let p = 1; p < points.length; p++) distanceKm += haversineKm(points[p - 1], points[p]);
        tracks.push({
            points,
            distanceKm: Number(distanceKm.toFixed(3)),
            startedAt: points[0].timestamp,
            endedAt: points[points.length - 1].timestamp,
            seeded: true,
        });
    }
    return tracks;
}

function makeEvents() {
    const goals: [string, number, number, number][] = [
        // title, day offset, start hour, duration in hours
        ['Leg day', -6, 7, 1],
        ['5 km run', -3, 6, 1],
        ['Chest & triceps', -1, 18, 1],
        ['Back & biceps', 1, 18, 1],
        ['Mobility & stretching', 3, 7, 1],
        ['10 km run', 6, 6, 2],
        ['Monthly progress check', 13, 20, 1],
    ];
    return goals.map(([title, day, hour, hours]) => {
        const start = atLocalTime(day, hour);
        return { title, start, end: new Date(start.getTime() + hours * 3_600_000), seeded: true };
    });
}

async function clear(userId: string) {
    for (const collection of COLLECTIONS) {
        const docs = await db.findEqual(['users', userId], collection, 'seeded', true, 5000);
        await inBatches(docs, 10, (doc) => db.delete(['users', userId, collection, doc.id]));
        console.log(`Removed ${docs.length} seeded ${collection}`);
    }
}

async function seed(userId: string) {
    const days = Number(args.days);
    const center = { lat: Number(args.lat), lng: Number(args.lng) };
    if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error('--days must be between 1 and 365');
    if (Number.isNaN(center.lat) || Number.isNaN(center.lng)) throw new Error('--lat and --lng must be numbers');

    const data = { sessions: makeSessions(days), tracks: makeTracks(8, center), events: makeEvents() };
    for (const collection of COLLECTIONS) {
        await inBatches(data[collection], 10, (doc) => db.create(['users', userId, collection, crypto.randomUUID()], doc));
        console.log(`Added ${data[collection].length} ${collection}`);
    }
}

const userId = await resolveUserId();
console.log(`User: ${userId}`);
await (args.clear ? clear(userId) : seed(userId));
console.log('Done.');
