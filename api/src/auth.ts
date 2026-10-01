import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AppEnv } from './types';

// One JWKS fetcher per tenant, reused across requests in the same isolate (jose caches the keys).
const jwksByDomain = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwks(domain: string) {
    let jwks = jwksByDomain.get(domain);
    if (!jwks) {
        jwks = createRemoteJWKSet(new URL(`https://${domain}/.well-known/jwks.json`));
        jwksByDomain.set(domain, jwks);
    }
    return jwks;
}

/** Verifies the Auth0 access token and exposes its `sub` as `c.var.userId`. */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
    const header = c.req.header('Authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) {
        throw new HTTPException(401, { message: 'Missing bearer token' });
    }

    try {
        const { payload } = await jwtVerify(token, getJwks(c.env.AUTH0_DOMAIN), {
            issuer: `https://${c.env.AUTH0_DOMAIN}/`,
            audience: c.env.AUTH0_AUDIENCE,
        });
        if (!payload.sub) throw new Error('Token has no subject');
        c.set('userId', payload.sub);
    } catch {
        throw new HTTPException(401, { message: 'Invalid or expired token' });
    }

    await next();
});
