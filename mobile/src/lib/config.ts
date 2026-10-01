// EXPO_PUBLIC_* values are inlined at build time (see the README). They are public, never secrets.
export const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? '';
export const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? '';
export const AUTH0_AUDIENCE = process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ?? '';
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL ?? '').replace(/\/$/, '');

export const missingConfig = Object.entries({
    EXPO_PUBLIC_AUTH0_DOMAIN: AUTH0_DOMAIN,
    EXPO_PUBLIC_AUTH0_CLIENT_ID: AUTH0_CLIENT_ID,
    EXPO_PUBLIC_AUTH0_AUDIENCE: AUTH0_AUDIENCE,
    EXPO_PUBLIC_API_URL: API_URL,
})
    .filter(([, value]) => !value)
    .map(([key]) => key);

export const EXERCISES = ['Cardio', 'Legs', 'Arms', 'Back', 'Chest', 'Shoulders', 'Abs'] as const;
export type Exercise = (typeof EXERCISES)[number];
