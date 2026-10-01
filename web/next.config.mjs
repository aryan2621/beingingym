import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Practise moved to the mobile app; the web keeps a read-only history.
    async redirects() {
        return [{ source: '/practise', destination: '/history', permanent: true }];
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'github.com' },
            { protocol: 'https', hostname: 'i.ytimg.com' },
            // Auth0 profile pictures (Google accounts and Gravatar fallbacks)
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: 's.gravatar.com' },
            { protocol: 'https', hostname: 'cdn.auth0.com' },
        ],
    },
    webpack(config) {
        // nextjs-auth0 lazy-loads its optional DPoP support with a dynamic import, which webpack flags as a
        // "Critical dependency" on every compile. We don't use DPoP, so the warning is just noise.
        config.ignoreWarnings = [...(config.ignoreWarnings ?? []), { module: /@auth0[\\/]nextjs-auth0[\\/]dist[\\/]utils[\\/]dpopUtils/ }];
        return config;
    },
};

initOpenNextCloudflareForDev();

export default nextConfig;
