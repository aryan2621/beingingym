import { Alert, Image, Linking, Text, View } from 'react-native';
import Constants from 'expo-constants';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';

import { Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { WEB_URL } from '@/lib/config';
import { space, useColors } from '@/lib/theme';

export default function Profile() {
    const { user, signOut } = useAuth();
    const c = useColors();
    const queryClient = useQueryClient();

    const confirmLogout = () =>
        Alert.alert('Log out?', 'You can log back in with the same account any time.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log out',
                style: 'destructive',
                onPress: async () => {
                    queryClient.clear();
                    await signOut();
                },
            },
        ]);

    return (
        <Screen>
            <Card style={{ alignItems: 'center', paddingVertical: space(8), gap: space(2) }}>
                {user?.picture ? (
                    <Image source={{ uri: user.picture }} style={{ width: 80, height: 80, borderRadius: 40 }} />
                ) : (
                    <Ionicons name='person-circle-outline' size={80} color={c.muted} />
                )}
                <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>{user?.name ?? 'Your account'}</Text>
                {user?.email ? <Text style={{ color: c.muted }}>{user.email}</Text> : null}
            </Card>

            <View style={{ gap: space(3), marginTop: space(5) }}>
                {WEB_URL ? (
                    <Button title='Open web dashboard' icon='open-outline' variant='outline' onPress={() => Linking.openURL(WEB_URL)} />
                ) : null}
                <Button title='Log out' icon='log-out-outline' variant='danger' onPress={confirmLogout} />
            </View>

            <Text style={{ color: c.muted, textAlign: 'center', marginTop: space(8), fontSize: 12 }}>
                BeingInGym {Constants.expoConfig?.version ?? ''}
            </Text>
        </Screen>
    );
}
