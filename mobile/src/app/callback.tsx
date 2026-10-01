import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth';
import { useColors } from '@/lib/theme';

/**
 * Auth0 redirects back to beingingym://callback (exp://…/--/callback in Expo Go). Expo Router opens that
 * deep link as a route, while AuthProvider finishes the code exchange; this screen waits for it.
 */
export default function Callback() {
    const { status, signingIn } = useAuth();
    const c = useColors();

    if (status === 'signedIn') return <Redirect href='/' />;
    if (status === 'signedOut' && !signingIn) return <Redirect href='/sign-in' />;

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
            <ActivityIndicator color={c.primary} />
        </View>
    );
}
