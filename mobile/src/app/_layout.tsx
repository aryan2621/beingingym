import { useEffect, useState } from 'react';
import { AppState, Platform, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '@/lib/auth';
import { useColors } from '@/lib/theme';
// Registers the background GPS task at startup (required for headless runs on Android).
import '@/lib/tracking';

// Refetch queries when the app comes back to the foreground.
function useAppStateFocus() {
    useEffect(() => {
        const sub = AppState.addEventListener('change', (status) => {
            if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
        });
        return () => sub.remove();
    }, []);
}

export default function RootLayout() {
    const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }));
    const c = useColors();
    const scheme = useColorScheme();
    useAppStateFocus();

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }}>
                    <Stack.Screen name='(tabs)' />
                    <Stack.Screen name='sign-in' />
                    <Stack.Screen
                        name='profile'
                        options={{
                            presentation: 'modal',
                            headerShown: true,
                            title: 'Profile',
                            headerStyle: { backgroundColor: c.background },
                            headerTintColor: c.text,
                        }}
                    />
                </Stack>
            </AuthProvider>
        </QueryClientProvider>
    );
}
