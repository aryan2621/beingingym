import { API_URL, type Exercise } from './config';
import { getAccessToken } from './auth';

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string
    ) {
        super(message);
    }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await getAccessToken();
    const res = await fetch(`${API_URL}/${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
    });
    if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new ApiError(res.status, body?.message ?? `Request failed (${res.status})`);
    }
    return (res.status === 204 ? undefined : await res.json()) as T;
}

const query = (params: Record<string, string | number | undefined>) => {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][];
    return entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))}` : '';
};

type Range = { from?: Date; to?: Date };
const rangeQuery = ({ from, to }: Range) => query({ from: from?.toISOString(), to: to?.toISOString() });

// ---- Profile ----

export type Profile = { id: string; name?: string; email?: string; picture?: string; createdAt?: string };
export const syncMe = (profile: Omit<Profile, 'id' | 'createdAt'>) => request<Profile>('me', { method: 'PUT', body: JSON.stringify(profile) });

// ---- Workout sessions ----

export type Session = { id: string; exercise: Exercise; duration: number; date: string };
export const listSessions = (range: Range = {}) => request<Session[]>(`sessions${rangeQuery(range)}`);
export const createSession = (session: { exercise: Exercise; duration: number }) =>
    request<Session>('sessions', { method: 'POST', body: JSON.stringify(session) });

// ---- Runs ----

export type TrackPoint = { lat: number; lng: number; timestamp: string };
export type Track = { id: string; points: TrackPoint[]; distanceKm: number; startedAt: string; endedAt: string };
export const listTracks = (range: Range = {}) => request<Track[]>(`tracks${rangeQuery(range)}`);
export const createTrack = (points: TrackPoint[]) => request<Track>('tracks', { method: 'POST', body: JSON.stringify({ points }) });

// ---- Goals (edited on the web, read-only here) ----

export type Goal = { id: string; title: string; start: string; end: string };
export const listGoals = (range: Range = {}) => request<Goal[]>(`events${rangeQuery(range)}`);

// ---- Progress ----

export type ProgressSummary = {
    totalSeconds: number;
    sessionCount: number;
    series: { bucket: string; seconds: number; sessions: number }[];
    byExercise: { exercise: Exercise; seconds: number }[];
};
export const getProgress = (range: 'Daily' | 'Weekly' | 'Monthly' = 'Daily') =>
    request<ProgressSummary>(`progress${query({ range, tzOffset: new Date().getTimezoneOffset() })}`);
