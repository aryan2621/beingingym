import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button, ErrorText } from '@/components/ui';
import { REDIRECT_URI, useAuth } from '@/lib/auth';
import { missingConfig } from '@/lib/config';
import { space, useColors } from '@/lib/theme';

export default function SignIn() {
    const { status, signIn, signingIn, error } = useAuth();
    const c = useColors();

    if (status === 'signedIn') return <Redirect href='/' />;

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
            <View style={styles.hero}>
                <View style={[styles.logo, { backgroundColor: c.primary }]}>
                    <Ionicons name='barbell' size={36} color={c.onPrimary} />
                </View>
                <Text style={[styles.title, { color: c.text }]}>
                    Every rep. Every run. <Text style={{ color: c.primary }}>Recorded.</Text>
                </Text>
                <Text style={{ color: c.muted, fontSize: 16, textAlign: 'center' }}>
                    Time your workouts and track your runs. See it all on your BeingInGym dashboard.
                </Text>
            </View>

            <View style={{ gap: space(3) }}>
                {missingConfig.length > 0 && <ErrorText>Missing app config: {missingConfig.join(', ')}. See the README.</ErrorText>}
                {error && <ErrorText>{error}</ErrorText>}
                <Button title='Log in or sign up' icon='log-in-outline' size='lg' onPress={signIn} loading={signingIn} disabled={missingConfig.length > 0} />
                <Text style={{ color: c.muted, textAlign: 'center', fontSize: 13 }}>Use the same Google or email account as on the web.</Text>
                {/* Shown in development so the callback URL can be added to Auth0. */}
                {__DEV__ && <Text style={{ color: c.muted, textAlign: 'center', fontSize: 11 }}>Callback: {REDIRECT_URI}</Text>}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, padding: space(6), justifyContent: 'space-between' },
    hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(5) },
    logo: { width: 76, height: 76, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 34, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5, lineHeight: 40 },
});
