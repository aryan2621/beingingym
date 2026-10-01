import { FlatList, Linking, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { addDays, format, isToday, isTomorrow } from 'date-fns';

import { Button, Empty, ErrorText, IconBadge, Loading, Title } from '@/components/ui';
import { listGoals } from '@/lib/api';
import { WEB_URL } from '@/lib/config';
import { radius, space, useColors } from '@/lib/theme';

const dayLabel = (d: Date) => (isToday(d) ? 'Today' : isTomorrow(d) ? 'Tomorrow' : format(d, 'EEE, d MMM'));

// Goals are planned on the web; the app shows what is coming up.
export default function Goals() {
    const c = useColors();
    const goals = useQuery({ queryKey: ['goals', 'list'], queryFn: () => listGoals({ from: new Date(), to: addDays(new Date(), 60) }) });

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
            <FlatList
                data={goals.data ?? []}
                keyExtractor={(g) => g.id}
                contentContainerStyle={{ padding: space(5), paddingBottom: space(10), gap: space(2) }}
                refreshControl={<RefreshControl refreshing={goals.isRefetching} onRefresh={() => goals.refetch()} tintColor={c.primary} />}
                ListHeaderComponent={<Title subtitle='Next 60 days · plan and edit goals on the web'>Goals</Title>}
                ListEmptyComponent={
                    goals.isLoading ? (
                        <Loading />
                    ) : goals.isError ? (
                        <ErrorText>Could not load your goals. Pull down to retry.</ErrorText>
                    ) : (
                        <Empty icon='calendar-outline' text='No upcoming goals. Plan your week on the BeingInGym website.' />
                    )
                }
                ListFooterComponent={
                    WEB_URL ? (
                        <Button
                            title='Plan goals on the web'
                            icon='open-outline'
                            variant='ghost'
                            style={{ marginTop: space(4) }}
                            onPress={() => Linking.openURL(`${WEB_URL}/goals`)}
                        />
                    ) : null
                }
                renderItem={({ item }) => {
                    const start = new Date(item.start);
                    return (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: space(3),
                                padding: space(4),
                                backgroundColor: c.card,
                                borderColor: c.border,
                                borderWidth: 1,
                                borderRadius: radius.md,
                            }}
                        >
                            <IconBadge name='flag-outline' />
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>{item.title}</Text>
                                <Text style={{ color: c.muted, fontSize: 13 }}>
                                    {dayLabel(start)} · {format(start, 'p')} – {format(new Date(item.end), 'p')}
                                </Text>
                            </View>
                        </View>
                    );
                }}
            />
        </SafeAreaView>
    );
}
