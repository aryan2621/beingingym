import { Auth0Client } from '@auth0/nextjs-auth0/server';

// Reads AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET and APP_BASE_URL from the environment.
export const auth0 = new Auth0Client({
    authorizationParameters: {
        // Access tokens are issued for the Cloudflare API so it can verify them.
        audience: process.env.AUTH0_AUDIENCE,
        scope: 'openid profile email offline_access',
    },
});
