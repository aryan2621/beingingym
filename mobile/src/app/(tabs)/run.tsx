import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Big, Button, Card, ErrorText, Label, Screen, Title } from '@/components/ui';
import { createTrack, type TrackPoint } from '@/lib/api';
import { formatClock, formatPace } from '@/lib/format';
import { space, useColors } from '@/lib/theme';
import { discardRun, distanceKm, isRecording, startRun, stopRun, subscribe, type RunMode } from '@/lib/tracking';

type Phase = 'idle' | 'recording' | 'finished';
const KEEP_AWAKE_TAG = 'run';

export default function Run() {
    const c = useColors();
    const queryClient = useQueryClient();
    const [phase, setPhase] = useState<Phase>('idle');
    const [mode, setMode] = useState<RunMode | null>(null);
    const [points, setPoints] = useState<TrackPoint[]>([]);
    const [startedAtState, setStartedAt] = useState<number | null>(null);
    const [endedAt, setEndedAt] = useState<number | null>(null);
    const [now, setNow] = useState(() => Date.now());
    const [error, setError] = useState<string | null>(null);

    useEffect(() => subscribe(setPoints), []);

    // Pick up a run that kept recording while the app was closed.
    useEffect(() => {
        isRecording().then((recording) => {
            if (recording) setPhase('recording');
        });
    }, []);

    // After an app restart mid-run, the first recorded point tells us when the run started.
    const startedAt = startedAtState ?? (phase !== 'idle' && points.length ? Date.parse(points[0].timestamp) : null);

    useEffect(() => {
        if (phase !== 'recording') return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        // Foreground mode only records while the screen is on.
        if (mode === 'foreground') activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
        return () => {
            clearInterval(id);
            deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
        };
    }, [phase, mode]);

    const elapsedSec = startedAt ? ((endedAt ?? now) - startedAt) / 1000 : 0;
    const km = distanceKm(points);

    const start = async () => {
        setError(null);
        try {
            const used = await startRun();
            setMode(used);
            setStartedAt(Date.now());
            setEndedAt(null);
            setPhase('recording');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not start tracking');
        }
    };

    const stop = async () => {
        const recorded = await stopRun();
        setPoints(recorded);
        setEndedAt(Date.now());
        setPhase('finished');
    };

    const reset = async () => {
        await discardRun();
        setPhase('idle');
        setStartedAt(null);
        setEndedAt(null);
        setMode(null);
    };

    const save = useMutation({
        mutationFn: () => createTrack(points),
        onSuccess: async (track) => {
            queryClient.invalidateQueries({ queryKey: ['tracks'] });
            await reset();
            Alert.alert('Run saved', `${track.distanceKm.toFixed(2)} km`);
        },
    });

    const confirmDiscard = () =>
        Alert.alert('Discard this run?', 'The recorded route will be deleted.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Discard', style: 'destructive', onPress: reset },
        ]);

    return (
        <Screen>
            <Title subtitle='Record a run or walk. It shows up on your web dashboard.'>Run</Title>

            <Card style={{ alignItems: 'center', paddingVertical: space(8), marginBottom: space(3) }}>
                <Label>Time</Label>
                <Text style={{ color: c.text, fontSize: 60, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -1 }}>
                    {formatClock(elapsedSec)}
                </Text>
                <Text style={{ color: phase === 'recording' ? c.primary : c.muted, fontWeight: '600' }}>
                    {phase === 'recording' ? '● Recording' : phase === 'finished' ? 'Finished' : 'Ready'}
                </Text>
            </Card>

            <View style={{ flexDirection: 'row', gap: space(3), marginBottom: space(5) }}>
                <Card style={{ flex: 1 }}>
                    <Label>Distance</Label>
                    <Big>{km.toFixed(2)} km</Big>
                </Card>
                <Card style={{ flex: 1 }}>
                    <Label>Pace</Label>
                    <Big>{formatPace(elapsedSec, km)}</Big>
                </Card>
            </View>

            {mode === 'foreground' && phase === 'recording' && (
                <Text style={{ color: c.muted, marginBottom: space(3), textAlign: 'center' }}>
                    Keep the app open: background location is off, so the screen stays on while recording.
                </Text>
            )}
            {error && <ErrorText>{error}</ErrorText>}

            {phase === 'idle' && <Button title='Start run' icon='play' size='lg' onPress={start} />}
            {phase === 'recording' && <Button title='Finish' icon='stop' size='lg' onPress={stop} />}
            {phase === 'finished' && (
                <View style={{ gap: space(3) }}>
                    <Button
                        title='Save run'
                        icon='checkmark'
                        size='lg'
                        onPress={() => save.mutate()}
                        loading={save.isPending}
                        disabled={points.length < 2}
                    />
                    <Button title='Discard' icon='trash-outline' variant='danger' onPress={confirmDiscard} disabled={save.isPending} />
                    {points.length < 2 && <Text style={{ color: c.muted, textAlign: 'center' }}>Not enough GPS points to save this run.</Text>}
                    {save.isError && <ErrorText>Could not save: {(save.error as Error).message}</ErrorText>}
                </View>
            )}
        </Screen>
    );
}
