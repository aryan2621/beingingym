import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import { AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_DOMAIN } from './config';

WebBrowser.maybeCompleteAuthSession();

/**
 * Auth0 login with Authorization Code + PKCE (no client secret in the app).
 * The refresh token lives in the device keystore (SecureStore); access tokens are kept in memory
 * and silently refreshed. Values are stored under separate keys because SecureStore warns above ~2 KB.
 */

const ISSUER = `https://${AUTH0_DOMAIN}`;
const SCOPES = ['openid', 'profile', 'email', 'offline_access'];
export const REDIRECT_URI = AuthSession.makeRedirectUri({ scheme: 'beingingym', path: 'callback' });

const KEYS = { refresh: 'auth.refreshToken', user: 'auth.user' };

export type User = { sub: string; name?: string; email?: string; picture?: string; given_name?: string };

type Session = { accessToken: string; expiresAt: number };

let discoveryPromise: Promise<AuthSession.DiscoveryDocument> | null = null;
const getDiscovery = () => (discoveryPromise ??= AuthSession.fetchDiscoveryAsync(ISSUER));

let session: Session | null = null;
let refreshing: Promise<string> | null = null;
let onSignedOut: (() => void) | null = null;

export class SignedOutError extends Error {
    constructor() {
        super('Signed out');
    }
}

async function saveTokens(tokens: AuthSession.TokenResponse) {
    session = { accessToken: tokens.accessToken, expiresAt: Date.now() + (tokens.expiresIn ?? 3600) * 1000 };
    // Auth0 may rotate refresh tokens; keep the newest one.
    if (tokens.refreshToken) await SecureStore.setItemAsync(KEYS.refresh, tokens.refreshToken);
}

async function clearTokens() {
    session = null;
    await Promise.all([SecureStore.deleteItemAsync(KEYS.refresh), SecureStore.deleteItemAsync(KEYS.user)]);
}

/** Returns a valid access token for the BeingInGym API, refreshing it when it is about to expire. */
export async function getAccessToken(): Promise<string> {
    if (session && session.expiresAt - 60_000 > Date.now()) return session.accessToken;
    refreshing ??= (async () => {
        try {
            const refreshToken = await SecureStore.getItemAsync(KEYS.refresh);
            if (!refreshToken) throw new SignedOutError();
            const tokens = await AuthSession.refreshAsync(
                { clientId: AUTH0_CLIENT_ID, refreshToken, extraParams: { audience: AUTH0_AUDIENCE } },
                await getDiscovery()
            );
            await saveTokens(tokens);
            return tokens.accessToken;
        } catch (err) {
            // An invalid/revoked refresh token means the user has to log in again.
            if (err instanceof SignedOutError || err instanceof AuthSession.TokenError) {
                await clearTokens();
                onSignedOut?.();
                throw new SignedOutError();
            }
            throw err;
        } finally {
            refreshing = null;
        }
    })();
    return refreshing;
}

type AuthState = {
    status: 'loading' | 'signedOut' | 'signedIn';
    user: User | null;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    signingIn: boolean;
    error: string | null;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const discovery = AuthSession.useAutoDiscovery(ISSUER);
    const [request, , promptAsync] = AuthSession.useAuthRequest(
        { clientId: AUTH0_CLIENT_ID, redirectUri: REDIRECT_URI, scopes: SCOPES, extraParams: { audience: AUTH0_AUDIENCE } },
        discovery
    );
    const [status, setStatus] = useState<AuthState['status']>('loading');
    const [user, setUser] = useState<User | null>(null);
    const [signingIn, setSigningIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Restore a previous session from the keystore.
    useEffect(() => {
        onSignedOut = () => {
            setUser(null);
            setStatus('signedOut');
        };
        (async () => {
            const [refreshToken, savedUser] = await Promise.all([
                SecureStore.getItemAsync(KEYS.refresh),
                SecureStore.getItemAsync(KEYS.user),
            ]);
            if (refreshToken && savedUser) {
                setUser(JSON.parse(savedUser));
                setStatus('signedIn');
            } else {
                setStatus('signedOut');
            }
        })().catch(() => setStatus('signedOut'));
        return () => {
            onSignedOut = null;
        };
    }, []);

    const signIn = useCallback(async () => {
        if (!request || !discovery) return;
        setError(null);
        setSigningIn(true);
        try {
            const result = await promptAsync();
            if (result.type !== 'success') {
                if (result.type === 'error') setError(result.error?.message ?? 'Login failed');
                return;
            }
            const tokens = await AuthSession.exchangeCodeAsync(
                {
                    clientId: AUTH0_CLIENT_ID,
                    code: result.params.code,
                    redirectUri: REDIRECT_URI,
                    extraParams: { code_verifier: request.codeVerifier ?? '' },
                },
                discovery
            );
            await saveTokens(tokens);
            const info = (await AuthSession.fetchUserInfoAsync({ accessToken: tokens.accessToken }, discovery)) as User;
            const profile: User = { sub: info.sub, name: info.name, email: info.email, picture: info.picture, given_name: info.given_name };
            await SecureStore.setItemAsync(KEYS.user, JSON.stringify(profile));
            setUser(profile);
            setStatus('signedIn');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setSigningIn(false);
        }
    }, [request, discovery, promptAsync]);

    const signOut = useCallback(async () => {
        await clearTokens();
        setUser(null);
        setStatus('signedOut');
        // End the Auth0 browser session too, so the next login can pick a different account.
        const logoutUrl = `${ISSUER}/v2/logout?${new URLSearchParams({ client_id: AUTH0_CLIENT_ID, returnTo: REDIRECT_URI })}`;
        await WebBrowser.openAuthSessionAsync(logoutUrl, REDIRECT_URI).catch(() => undefined);
    }, []);

    const value = useMemo(
        () => ({ status, user, signIn, signOut, signingIn: signingIn || !request, error }),
        [status, user, signIn, signOut, signingIn, request, error]
    );
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
