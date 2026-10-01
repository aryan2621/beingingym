import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { haversineKm } from './format';
import type { TrackPoint } from './api';

/**
 * GPS run recording. In a release/dev build the run keeps recording with the screen off through a
 * foreground-service location task. Expo Go can't run background location on Android, so there we fall
 * back to foreground updates (keep the app open). Points are persisted so a killed app doesn't lose the run.
 */

const TASK = 'beingingym-run-tracking';
const STORAGE_KEY = 'run.points';
const MAX_ACCURACY_M = 35; // ignore noisy fixes
const MAX_POINTS = 5000; // API limit

export type RunMode = 'background' | 'foreground';

let points: TrackPoint[] = [];
let loaded = false;
let foregroundSub: Location.LocationSubscription | null = null;
const listeners = new Set<(points: TrackPoint[]) => void>();

async function ensureLoaded() {
    if (loaded) return;
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    points = raw ? JSON.parse(raw) : [];
    loaded = true;
}

async function addLocations(locations: Location.LocationObject[]) {
    await ensureLoaded();
    const fresh = locations
        .filter((l) => (l.coords.accuracy ?? 0) <= MAX_ACCURACY_M)
        .map((l) => ({ lat: l.coords.latitude, lng: l.coords.longitude, timestamp: new Date(l.timestamp).toISOString() }))
        .filter((p) => !points.length || p.timestamp > points[points.length - 1].timestamp);
    if (!fresh.length) return;
    points = [...points, ...fresh];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(points));
    listeners.forEach((l) => l(points));
}

// Must be defined at module load (imported from the root layout) so Android can run it headless.
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TASK, async ({ data, error }) => {
    if (error || !data) return;
    await addLocations(data.locations);
});

export function subscribe(listener: (points: TrackPoint[]) => void) {
    listeners.add(listener);
    ensureLoaded().then(() => listener(points));
    return () => {
        listeners.delete(listener);
    };
}

export async function isRecording() {
    if (foregroundSub) return true;
    return Location.hasStartedLocationUpdatesAsync(TASK).catch(() => false);
}

/** Starts recording; returns the mode actually used, or throws if location permission is denied. */
export async function startRun(): Promise<RunMode> {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') throw new Error('Location permission is needed to record your run.');

    await AsyncStorage.removeItem(STORAGE_KEY);
    points = [];
    loaded = true;
    listeners.forEach((l) => l(points));

    try {
        const bg = await Location.requestBackgroundPermissionsAsync();
        if (bg.status !== 'granted') throw new Error('background denied');
        await Location.startLocationUpdatesAsync(TASK, {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 3000,
            distanceInterval: 5,
            activityType: Location.LocationActivityType.Fitness,
            pausesUpdatesAutomatically: false,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
                notificationTitle: 'Recording your run',
                notificationBody: 'BeingInGym is tracking your route.',
                notificationColor: '#C2410C',
            },
        });
        return 'background';
    } catch {
        // Expo Go, or the user only allowed "while using the app".
        foregroundSub = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 3000, distanceInterval: 5 },
            (location) => void addLocations([location])
        );
        return 'foreground';
    }
}

/** Stops recording and returns the recorded points (downsampled to the API limit). */
export async function stopRun(): Promise<TrackPoint[]> {
    foregroundSub?.remove();
    foregroundSub = null;
    if (await Location.hasStartedLocationUpdatesAsync(TASK).catch(() => false)) {
        await Location.stopLocationUpdatesAsync(TASK);
    }
    await ensureLoaded();
    if (points.length <= MAX_POINTS) return points;
    const step = points.length / MAX_POINTS;
    return Array.from({ length: MAX_POINTS }, (_, i) => points[Math.floor(i * step)]);
}

export async function discardRun() {
    points = [];
    await AsyncStorage.removeItem(STORAGE_KEY);
    listeners.forEach((l) => l(points));
}

export function distanceKm(track: TrackPoint[]) {
    let km = 0;
    for (let i = 1; i < track.length; i++) km += haversineKm(track[i - 1], track[i]);
    return km;
}
