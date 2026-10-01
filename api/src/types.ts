export type Bindings = {
    WEB_ORIGIN: string;
    AUTH0_DOMAIN: string;
    AUTH0_AUDIENCE: string;
    FIREBASE_PROJECT_ID: string;
    FIREBASE_CLIENT_EMAIL: string;
    FIREBASE_PRIVATE_KEY: string;
    YOUTUBE_API_KEY: string;
};

export type Variables = {
    userId: string;
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };

export const EXERCISES = ['Cardio', 'Legs', 'Arms', 'Back', 'Chest', 'Shoulders', 'Abs'] as const;
export type Exercise = (typeof EXERCISES)[number];
