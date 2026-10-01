import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '../types';

const CACHE_SECONDS = 3600;

// Public: tutorials work without login. Responses are edge-cached so the YouTube quota isn't spent per visitor.
export const videos = new Hono<AppEnv>().get('/:playlistId', async (c) => {
    const playlistId = c.req.param('playlistId');
    if (!/^[A-Za-z0-9_-]{10,64}$/.test(playlistId)) {
        throw new HTTPException(400, { message: 'Invalid playlist id' });
    }

    const cache = caches.default;
    const cacheKey = new Request(new URL(`/videos/${playlistId}`, c.req.url).toString());
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.search = new URLSearchParams({ part: 'snippet', maxResults: '10', playlistId, key: c.env.YOUTUBE_API_KEY }).toString();
    const upstream = await fetch(url);
    if (!upstream.ok) {
        throw new HTTPException(502, { message: `YouTube API error ${upstream.status}` });
    }

    const res = new Response(upstream.body, {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${CACHE_SECONDS}` },
    });
    c.executionCtx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
});
