export const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/** 00:00 or 1:02:03 for a running clock. */
export const formatClock = (totalSeconds: number) => {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(sec).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

/** Minutes per km, e.g. 5'42". */
export const formatPace = (seconds: number, km: number) => {
    if (km < 0.05 || seconds <= 0) return '–';
    const perKm = seconds / km;
    return `${Math.floor(perKm / 60)}'${String(Math.round(perKm % 60)).padStart(2, '0')}"`;
};

const toRad = (deg: number) => (deg * Math.PI) / 180;

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
