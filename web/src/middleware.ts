import { NextResponse, type NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';

const PROTECTED_PATHS = ['/goals', '/history', '/progress', '/tracking', '/profile'];

export async function middleware(request: NextRequest) {
    // Handles /auth/login, /auth/logout, /auth/callback, /auth/profile, /auth/access-token and rolling sessions.
    const authResponse = await auth0.middleware(request);

    const { pathname, search } = request.nextUrl;
    if (pathname.startsWith('/auth')) return authResponse;

    if (PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
        const session = await auth0.getSession(request);
        if (!session) {
            const loginUrl = new URL('/auth/login', request.nextUrl.origin);
            loginUrl.searchParams.set('returnTo', `${pathname}${search}`);
            return NextResponse.redirect(loginUrl);
        }
    }

    return authResponse;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)'],
};
