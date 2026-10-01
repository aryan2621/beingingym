import { useMemo, useState } from 'react';
import { RefreshControl, SectionList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow, isToday, isYesterday, startOfDay, subDays } from 'date-fns';

import { Empty, ErrorText, Loading, Segmented, Title } from '@/components/ui';
import { listSessions, listTracks } from '@/lib/api';
import { formatDuration } from '@/lib/format';
import { radius, space, useColors } from '@/lib/theme';

type Tab = 'Workouts' | 'Runs';
type Row = { id: string; title: string; subtitle: string; value: string };

const dayLabel = (d: Date) => (isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'EEEE, d MMM'));

export default function History() {
    const c = useColors();
    const [tab, setTab] = useState<Tab>('Workouts');
    const from = startOfDay(subDays(new Date(), 29));
    const sessions = useQuery({ queryKey: ['sessions', 'history'], queryFn: () => listSessions({ from }) });
    const tracks = useQuery({ queryKey: ['tracks', 'history'], queryFn: () => listTracks({ from }) });
    const active = tab === 'Workouts' ? sessions : tracks;

    const sections = useMemo(() => {
        const rows: { date: Date; row: Row }[] =
            tab === 'Workouts'
                ? (sessions.data ?? []).map((s) => ({
                      date: new Date(s.date),
                      row: { id: s.id, title: s.exercise, subtitle: format(new Date(s.date), 'p'), value: formatDuration(s.duration) },
                  }))
                : (tracks.data ?? []).map((t) => ({
                      date: new Date(t.startedAt),
                      row: {
                          id: t.id,
                          title: `${t.distanceKm.toFixed(2)} km`,
                          subtitle: formatDistanceToNow(new Date(t.startedAt), { addSuffix: true }),
                          value: formatDuration((Date.parse(t.endedAt) - Date.parse(t.startedAt)) / 1000),
                      },
                  }));
        const groups = new Map<string, { title: string; data: Row[] }>();
        for (const { date, row } of rows.reverse()) {
            const key = format(date, 'yyyy-MM-dd');
            const group = groups.get(key) ?? { title: dayLabel(date), data: [] };
            group.data.push(row);
            groups.set(key, group);
        }
        return [...groups.values()];
    }, [tab, sessions.data, tracks.data]);

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: space(5), paddingBottom: space(10) }}
                stickySectionHeadersEnabled={false}
                refreshControl={<RefreshControl refreshing={active.isRefetching} onRefresh={() => active.refetch()} tintColor={c.primary} />}
                ListHeaderComponent={
                    <View style={{ marginBottom: space(4) }}>
                        <Title subtitle='Last 30 days'>History</Title>
                        <Segmented<Tab> options={['Workouts', 'Runs']} value={tab} onChange={setTab} />
                    </View>
                }
                ListEmptyComponent={
                    active.isLoading ? (
                        <Loading />
                    ) : active.isError ? (
                        <ErrorText>Could not load your history. Pull down to retry.</ErrorText>
                    ) : (
                        <Empty icon={tab === 'Workouts' ? 'timer-outline' : 'walk-outline'} text={`No ${tab.toLowerCase()} in the last 30 days.`} />
                    )
                }
                renderSectionHeader={({ section }) => (
                    <Text style={{ color: c.muted, fontWeight: '700', marginTop: space(4), marginBottom: space(2) }}>{section.title}</Text>
                )}
                renderItem={({ item, index, section }) => (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: space(4),
                            backgroundColor: c.card,
                            borderColor: c.border,
                            borderWidth: 1,
                            borderTopWidth: index === 0 ? 1 : 0,
                            borderTopLeftRadius: index === 0 ? radius.md : 0,
                            borderTopRightRadius: index === 0 ? radius.md : 0,
                            borderBottomLeftRadius: index === section.data.length - 1 ? radius.md : 0,
                            borderBottomRightRadius: index === section.data.length - 1 ? radius.md : 0,
                        }}
                    >
                        <View>
                            <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>{item.title}</Text>
                            <Text style={{ color: c.muted, fontSize: 13 }}>{item.subtitle}</Text>
                        </View>
                        <Text style={{ color: c.text, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{item.value}</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}
