'use client';

import { useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import { syncMe } from '@/service/api';

const SYNCED_KEY = 'beingingym:profile-synced';

/** Copies the Auth0 profile into Firestore once per browser session after login. */
export default function ProfileSync() {
    const { user } = useUser();

    useEffect(() => {
        if (!user?.sub) return;
        try {
            if (sessionStorage.getItem(SYNCED_KEY) === user.sub) return;
        } catch {
            // Storage can be unavailable (private mode); syncing again is harmless.
        }
        syncMe({ name: user.name ?? undefined, email: user.email ?? undefined, picture: user.picture ?? undefined })
            .then(() => {
                try {
                    sessionStorage.setItem(SYNCED_KEY, user.sub);
                } catch {}
            })
            .catch((err) => console.error('Profile sync failed', err));
    }, [user]);

    return null;
}
