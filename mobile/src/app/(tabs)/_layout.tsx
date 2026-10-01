import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { syncMe } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const TABS: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
    { name: 'index', title: 'Today', icon: 'home-outline', iconActive: 'home' },
    { name: 'workout', title: 'Workout', icon: 'timer-outline', iconActive: 'timer' },
    { name: 'run', title: 'Run', icon: 'walk-outline', iconActive: 'walk' },
    { name: 'history', title: 'History', icon: 'time-outline', iconActive: 'time' },
    { name: 'goals', title: 'Goals', icon: 'calendar-outline', iconActive: 'calendar' },
];

export default function TabsLayout() {
    const { status, user } = useAuth();
    const c = useColors();

    // Keep the web profile (name, email, picture) in sync with Auth0.
    useEffect(() => {
        if (status === 'signedIn' && user) {
            syncMe({ name: user.name, email: user.email, picture: user.picture }).catch(() => undefined);
        }
    }, [status, user]);

    if (status === 'loading') {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
                <ActivityIndicator color={c.primary} />
            </View>
        );
    }
    if (status === 'signedOut') return <Redirect href='/sign-in' />;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: c.primary,
                tabBarInactiveTintColor: c.muted,
                tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border },
                sceneStyle: { backgroundColor: c.background },
            }}
        >
            {TABS.map((tab) => (
                <Tabs.Screen
                    key={tab.name}
                    name={tab.name}
                    options={{
                        title: tab.title,
                        tabBarIcon: ({ color, focused, size }) => <Ionicons name={focused ? tab.iconActive : tab.icon} size={size} color={color} />,
                    }}
                />
            ))}
        </Tabs>
    );
}
