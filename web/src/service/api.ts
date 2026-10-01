import ky from 'ky';
import { getAccessToken } from '@auth0/nextjs-auth0';
import { Event } from '@/model/event';
import { Exercise, Progress } from '@/utils/enum';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';

const publicApi = ky.create({ prefixUrl: API_URL });

// Every call to the Cloudflare API carries the Auth0 access token from the current session.
const api = publicApi.extend({
    hooks: {
        beforeRequest: [
            async (request) => {
                request.headers.set('Authorization', `Bearer ${await getAccessToken()}`);
            },
        ],
    },
});

type Range = { from?: Date; to?: Date };

const rangeParams = ({ from, to }: Range) => {
    const params: Record<string, string> = {};
    if (from) params.from = from.toISOString();
    if (to) params.to = to.toISOString();
    return params;
};

// ---- Profile ----

export interface UserProfile {
    id: string;
    name?: string;
    email?: string;
    picture?: string;
    createdAt?: string;
}

export const getMe = () => api.get('me').json<UserProfile>();

export const syncMe = (profile: Omit<UserProfile, 'id' | 'createdAt'>) => api.put('me', { json: profile }).json<UserProfile>();

// ---- Goals calendar events ----

type EventDto = { id: string; title: string; start: string; end: string };

const toEvent = (e: EventDto): Event => ({ ...e, start: new Date(e.start), end: new Date(e.end) });

export const listEvents = async (range: Range = {}) =>
    (await api.get('events', { searchParams: rangeParams(range) }).json<EventDto[]>()).map(toEvent);

export const createEvent = async (event: Omit<Event, 'id'>) => toEvent(await api.post('events', { json: event }).json<EventDto>());

export const updateEvent = async ({ id, ...event }: Event) => toEvent(await api.put(`events/${id}`, { json: event }).json<EventDto>());

export const deleteEvent = (id: string) => api.delete(`events/${id}`);

// ---- Practise sessions (recorded by the mobile app; read-only on the web) ----

export interface ExerciseSession {
    id: string;
    exercise: Exercise;
    /** Seconds. */
    duration: number;
    date: string;
}

export const listSessions = (range: Range = {}) => api.get('sessions', { searchParams: rangeParams(range) }).json<ExerciseSession[]>();

// ---- Tracking ----

export interface TrackPoint {
    lat: number;
    lng: number;
    timestamp: string;
}

export interface Track {
    id: string;
    points: TrackPoint[];
    distanceKm: number;
    startedAt: string;
    endedAt: string;
}

export const listTracks = (range: Range = {}) => api.get('tracks', { searchParams: rangeParams(range) }).json<Track[]>();

// ---- Progress ----

export interface ProgressSummary {
    range: Progress;
    from: string;
    totalSeconds: number;
    sessionCount: number;
    series: { bucket: string; seconds: number; sessions: number }[];
    byExercise: { exercise: Exercise; seconds: number }[];
}

export const getProgress = (range: Progress) =>
    api.get('progress', { searchParams: { range, tzOffset: new Date().getTimezoneOffset() } }).json<ProgressSummary>();

// ---- Tutorials (public) ----

export interface PlaylistItem {
    id: string;
    snippet: {
        title: string;
        description: string;
        resourceId: { videoId: string };
        thumbnails: Record<string, { url: string; width: number; height: number } | undefined>;
    };
}

export const fetchPlaylist = (playlistId: string) => publicApi.get(`videos/${playlistId}`).json<{ items?: PlaylistItem[] }>();
