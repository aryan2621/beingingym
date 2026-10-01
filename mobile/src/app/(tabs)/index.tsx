import { useMemo } from 'react';
import { Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { addDays, format, isToday, isTomorrow } from 'date-fns';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Big, Button, Card, IconBadge, Label, Screen } from '@/components/ui';
import { getProgress, listGoals } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDuration } from '@/lib/format';
import { space, useColors } from '@/lib/theme';

const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const goalDay = (d: Date) => (isToday(d) ? 'Today' : isTomorrow(d) ? 'Tomorrow' : format(d, 'EEE, d MMM'));

export default function Today() {
    const { user } = useAuth();
    const c = useColors();
    const progress = useQuery({ queryKey: ['progress', 'Daily'], queryFn: () => getProgress('Daily') });
    const goals = useQuery({ queryKey: ['goals', 'upcoming'], queryFn: () => listGoals({ from: new Date(), to: addDays(new Date(), 30) }) });

    const stats = useMemo(() => {
        const series = progress.data?.series ?? [];
        const week = series.slice(-7);
        let streak = 0;
        let i = series.length - 1;
        if (i >= 0 && series[i].seconds === 0) i--; // today not trained yet: the streak is still alive
        for (; i >= 0 && series[i].seconds > 0; i--) streak++;
        const max = Math.max(...week.map((b) => b.seconds), 1);
        return {
            weekSeconds: week.reduce((s, b) => s + b.seconds, 0),
            weekSessions: week.reduce((s, b) => s + b.sessions, 0),
            streak,
            bars: week.map((b) => ({ key: b.bucket, ratio: b.seconds / max, day: format(new Date(`${b.bucket}T00:00:00`), 'EEEEE') })),
        };
    }, [progress.data]);

    const nextGoal = goals.data?.[0];
    const refreshing = progress.isRefetching || goals.isRefetching;

    return (
        <Screen
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                        progress.refetch();
                        goals.refetch();
                    }}
                    tintColor={c.primary}
                />
            }
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space(5) }}>
                <View>
                    <Text style={{ color: c.muted }}>{format(new Date(), 'EEEE, d MMMM')}</Text>
                    <Text style={{ color: c.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>
                        {greeting()}
                        {user?.given_name || user?.name ? `, ${user.given_name ?? user.name?.split(' ')[0]}` : ''}
                    </Text>
                </View>
                <Link href='/profile' asChild>
                    <Pressable accessibilityRole='button' accessibilityLabel='Profile'>
                        {user?.picture ? (
                            <Image source={{ uri: user.picture }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                        ) : (
                            <Ionicons name='person-circle-outline' size={40} color={c.muted} />
                        )}
                    </Pressable>
                </Link>
            </View>

            {/* This week */}
            <Card style={{ marginBottom: space(3) }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                        <Label>This week</Label>
                        <Big>{progress.isLoading ? '–' : formatDuration(stats.weekSeconds)}</Big>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Label>Streak</Label>
                        <Big color={c.primary}>
                            {progress.isLoading ? '–' : `${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}`}
                        </Big>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 64, marginTop: space(4) }}>
                    {stats.bars.map((b) => (
                        <View key={b.key} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                            <View
                                style={{
                                    width: '100%',
                                    height: Math.max(b.ratio * 48, 4),
                                    borderTopLeftRadius: 4,
                                    borderTopRightRadius: 4,
                                    backgroundColor: b.ratio > 0 ? c.primary : c.border,
                                }}
                            />
                            <Text style={{ color: c.muted, fontSize: 11 }}>{b.day}</Text>
                        </View>
                    ))}
                </View>
                <Text style={{ color: c.muted, fontSize: 13, marginTop: space(3) }}>
                    {stats.weekSessions} {stats.weekSessions === 1 ? 'session' : 'sessions'} in the last 7 days
                </Text>
            </Card>

            {/* Quick start */}
            <View style={{ flexDirection: 'row', gap: space(3), marginBottom: space(3) }}>
                <Button title='Workout' icon='timer-outline' size='lg' style={{ flex: 1 }} onPress={() => router.push('/workout')} />
                <Button title='Run' icon='walk-outline' size='lg' variant='outline' style={{ flex: 1 }} onPress={() => router.push('/run')} />
            </View>

            {/* Next goal */}
            <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(3) }}>
                    <IconBadge name='calendar-outline' />
                    <View style={{ flex: 1 }}>
                        <Label>Next goal</Label>
                        {goals.isLoading ? (
                            <Text style={{ color: c.muted }}>Loading…</Text>
                        ) : nextGoal ? (
                            <>
                                <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>{nextGoal.title}</Text>
                                <Text style={{ color: c.muted, fontSize: 13 }}>
                                    {goalDay(new Date(nextGoal.start))} · {format(new Date(nextGoal.start), 'p')}
                                </Text>
                            </>
                        ) : (
                            <Text style={{ color: c.text }}>Nothing planned. Add goals on the web.</Text>
                        )}
                    </View>
                </View>
            </Card>
        </Screen>
    );
}
