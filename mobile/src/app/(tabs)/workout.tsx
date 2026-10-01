import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, Vibration, View } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button, Card, Chip, ErrorText, Screen, Segmented, Title } from '@/components/ui';
import { createSession } from '@/lib/api';
import { EXERCISES, type Exercise } from '@/lib/config';
import { formatClock, formatDuration } from '@/lib/format';
import { space, useColors } from '@/lib/theme';

type Mode = 'Stopwatch' | 'Timer';
const TIMER_MINUTES = [5, 10, 15, 20, 30, 45, 60];
const KEEP_AWAKE_TAG = 'workout';

export default function Workout() {
    const c = useColors();
    const queryClient = useQueryClient();
    const [exercise, setExercise] = useState<Exercise>('Cardio');
    const [mode, setMode] = useState<Mode>('Stopwatch');
    const [targetMin, setTargetMin] = useState(20);
    // Time is derived from timestamps, so it stays correct while the app is in the background.
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [accumulatedMs, setAccumulatedMs] = useState(0);
    const [now, setNow] = useState(() => Date.now());

    const running = startedAt !== null;
    const elapsedMs = accumulatedMs + (running ? now - startedAt : 0);
    const targetMs = targetMin * 60_000;
    const elapsedSec = Math.floor((mode === 'Timer' ? Math.min(elapsedMs, targetMs) : elapsedMs) / 1000);
    const display = mode === 'Timer' ? formatClock((targetMs - Math.min(elapsedMs, targetMs)) / 1000) : formatClock(elapsedMs / 1000);

    useEffect(() => {
        if (startedAt === null) return;
        activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
        const id = setInterval(() => {
            const t = Date.now();
            setNow(t);
            // Countdown finished: stop at exactly the target and buzz.
            if (mode === 'Timer' && accumulatedMs + t - startedAt >= targetMs) {
                setAccumulatedMs(targetMs);
                setStartedAt(null);
                Vibration.vibrate([0, 400, 200, 400]);
            }
        }, 250);
        return () => {
            clearInterval(id);
            deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
        };
    }, [startedAt, accumulatedMs, mode, targetMs]);

    const reset = () => {
        setStartedAt(null);
        setAccumulatedMs(0);
    };

    const toggle = () => {
        if (running) {
            setAccumulatedMs(elapsedMs);
            setStartedAt(null);
        } else {
            if (mode === 'Timer' && elapsedMs >= targetMs) setAccumulatedMs(0);
            setNow(Date.now());
            setStartedAt(Date.now());
        }
    };

    const save = useMutation({
        mutationFn: () => createSession({ exercise, duration: Math.min(elapsedSec, 86_400) }),
        onSuccess: (session) => {
            reset();
            queryClient.invalidateQueries({ queryKey: ['progress'] });
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
            Alert.alert('Workout saved', `${session.exercise} · ${formatDuration(session.duration)}`);
        },
    });

    const started = elapsedMs > 0;

    return (
        <Screen>
            <Title subtitle='Pick an exercise, start the clock, save when done.'>Workout</Title>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space(2), paddingBottom: space(4) }}>
                {EXERCISES.map((e) => (
                    <Chip key={e} label={e} selected={e === exercise} onPress={() => !started && setExercise(e)} />
                ))}
            </ScrollView>

            <Segmented<Mode> options={['Stopwatch', 'Timer']} value={mode} onChange={(m) => !started && setMode(m)} />

            {mode === 'Timer' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space(2), paddingTop: space(3) }}>
                    {TIMER_MINUTES.map((m) => (
                        <Chip key={m} label={`${m} min`} selected={m === targetMin} onPress={() => !started && setTargetMin(m)} />
                    ))}
                </ScrollView>
            )}

            <Card style={{ alignItems: 'center', paddingVertical: space(10), marginVertical: space(5) }}>
                <Text style={{ color: c.muted, fontWeight: '600' }}>{exercise}</Text>
                <Text
                    accessibilityRole='timer'
                    style={{ color: c.text, fontSize: 64, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -1 }}
                >
                    {display}
                </Text>
                <Text style={{ color: c.muted }}>{running ? 'Running' : started ? 'Paused' : 'Ready'}</Text>
            </Card>

            <View style={{ gap: space(3) }}>
                <Button
                    title={running ? 'Pause' : started ? 'Resume' : 'Start'}
                    icon={running ? 'pause' : 'play'}
                    size='lg'
                    onPress={toggle}
                />
                <View style={{ flexDirection: 'row', gap: space(3) }}>
                    <Button title='Reset' icon='refresh' variant='outline' style={{ flex: 1 }} onPress={reset} disabled={!started || save.isPending} />
                    <Button
                        title='Save'
                        icon='checkmark'
                        variant='outline'
                        style={{ flex: 1 }}
                        onPress={() => {
                            if (running) toggle();
                            save.mutate();
                        }}
                        disabled={elapsedSec < 1}
                        loading={save.isPending}
                    />
                </View>
                {save.isError && <ErrorText>Could not save: {(save.error as Error).message}</ErrorText>}
            </View>
        </Screen>
    );
}
