import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from './auth';
import { events } from './routes/events';
import { me } from './routes/me';
import { progress } from './routes/progress';
import { sessions } from './routes/sessions';
import { tracks } from './routes/tracks';
import { videos } from './routes/videos';
import type { AppEnv } from './types';

const app = new Hono<AppEnv>();

app.use('*', (c, next) =>
    cors({
        origin: c.env.WEB_ORIGIN.split(',').map((o) => o.trim()),
        allowHeaders: ['Authorization', 'Content-Type'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        maxAge: 600,
    })(c, next)
);

app.get('/health', (c) => c.json({ ok: true }));
app.route('/videos', videos);

for (const path of ['/me', '/events', '/sessions', '/tracks', '/progress']) {
    app.use(path, requireAuth);
    app.use(`${path}/*`, requireAuth);
}
app.route('/me', me);
app.route('/events', events);
app.route('/sessions', sessions);
app.route('/tracks', tracks);
app.route('/progress', progress);

app.notFound((c) => c.json({ message: 'Not found' }, 404));

app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return c.json({ message: err.message }, err.status);
    }
    console.error(err);
    return c.json({ message: 'Internal server error' }, 500);
});

export default app;
