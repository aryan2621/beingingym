'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, format, formatDistanceToNow, isToday, isTomorrow, parseISO, startOfDay, subDays } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ArrowRight, CalendarCheck, Clock, Flame, History, MapPin, Route, Smartphone, type LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { getProgress, listEvents, listSessions, listTracks } from '@/service/api';
import { Progress } from '@/utils/enum';

const chartConfig = { minutes: { label: 'Minutes', color: 'hsl(var(--chart-1))' } } satisfies ChartConfig;

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const greeting = () => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
};

const goalDay = (date: Date) => (isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'EEE, d MMM'));

function StatTile({ label, value, hint, icon: Icon }: { label: string; value: string; hint?: string; icon: LucideIcon }) {
    return (
        <Card>
            <CardHeader className='flex-row items-start justify-between space-y-0 pb-2'>
                <CardDescription>{label}</CardDescription>
                <Icon className='h-4 w-4 text-muted-foreground' aria-hidden='true' />
            </CardHeader>
            <CardContent>
                <p className='text-3xl font-bold tabular-nums'>{value}</p>
                {hint && <p className='mt-1 text-xs text-muted-foreground'>{hint}</p>}
            </CardContent>
        </Card>
    );
}

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link href={href} className='flex items-center gap-1 text-sm font-medium text-primary hover:underline'>
            {children}
            <ArrowRight className='h-4 w-4' aria-hidden='true' />
        </Link>
    );
}

export function Dashboard({ name }: { name?: string }) {
    const progressQuery = useQuery({ queryKey: ['progress', Progress.Daily], queryFn: () => getProgress(Progress.Daily) });
    const sessionsQuery = useQuery({
        queryKey: ['sessions', 'recent'],
        queryFn: () => listSessions({ from: startOfDay(subDays(new Date(), 13)) }),
    });
    const eventsQuery = useQuery({
        queryKey: ['events', 'upcoming'],
        queryFn: () => listEvents({ from: new Date(), to: addDays(new Date(), 30) }),
    });
    const tracksQuery = useQuery({
        queryKey: ['tracks', 'recent'],
        queryFn: () => listTracks({ from: startOfDay(subDays(new Date(), 29)) }),
    });

    const stats = useMemo(() => {
        const series = progressQuery.data?.series ?? [];
        const lastWeek = series.slice(-7);
        // Streak: consecutive active days ending today (or yesterday, so it survives until you train today).
        let streak = 0;
        let i = series.length - 1;
        if (i >= 0 && series[i].seconds === 0) i--;
        for (; i >= 0 && series[i].seconds > 0; i--) streak++;
        return {
            weekSeconds: lastWeek.reduce((sum, b) => sum + b.seconds, 0),
            weekSessions: lastWeek.reduce((sum, b) => sum + b.sessions, 0),
            streak,
            streakCapped: streak === series.length && series.length > 0,
            chart: series.map((b) => ({ label: format(parseISO(b.bucket), 'd MMM'), minutes: Math.round(b.seconds / 60) })),
        };
    }, [progressQuery.data]);

    const tracks = tracksQuery.data ?? [];
    const monthKm = tracks.reduce((sum, t) => sum + t.distanceKm, 0);
    const lastTrack = tracks[tracks.length - 1];
    const recentSessions = [...(sessionsQuery.data ?? [])].reverse().slice(0, 5);
    const upcoming = (eventsQuery.data ?? []).slice(0, 4);
    const firstName = name?.split(' ')[0];
    const hasAnyData = (progressQuery.data?.sessionCount ?? 0) > 0 || tracks.length > 0;
    const loading = progressQuery.isLoading || tracksQuery.isLoading;

    return (
        <div className='space-y-8'>
            <div>
                <p className='text-sm text-muted-foreground'>{format(new Date(), 'EEEE, d MMMM')}</p>
                <h1 className='text-3xl font-bold tracking-tight'>
                    {greeting()}
                    {firstName ? `, ${firstName}` : ''}
                </h1>
            </div>

            {!loading && !hasAnyData && (
                <Card className='border-dashed'>
                    <CardContent className='flex flex-col items-start gap-2 py-6 sm:flex-row sm:items-center'>
                        <Smartphone className='h-6 w-6 text-primary' aria-hidden='true' />
                        <p className='text-muted-foreground'>
                            No workouts yet. Record a session or a run in the BeingInGym mobile app and it will show up here.
                        </p>
                        <Link href='/download' className='shrink-0 text-sm font-medium text-primary hover:underline sm:ml-auto'>
                            Get the app
                        </Link>
                    </CardContent>
                </Card>
            )}

            <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
                <StatTile label='This week' value={loading ? '–' : formatDuration(stats.weekSeconds)} hint='Last 7 days' icon={Clock} />
                <StatTile label='Sessions' value={loading ? '–' : String(stats.weekSessions)} hint='Last 7 days' icon={History} />
                <StatTile
                    label='Streak'
                    value={loading ? '–' : `${stats.streak}${stats.streakCapped ? '+' : ''} ${stats.streak === 1 ? 'day' : 'days'}`}
                    hint='Days in a row with a workout'
                    icon={Flame}
                />
                <StatTile label='Distance' value={tracksQuery.isLoading ? '–' : `${monthKm.toFixed(1)} km`} hint='Last 30 days' icon={Route} />
            </div>

            <div className='grid gap-6 lg:grid-cols-3'>
                <Card className='lg:col-span-2'>
                    <CardHeader className='flex-row items-start justify-between space-y-0'>
                        <div>
                            <CardTitle>Workout minutes</CardTitle>
                            <CardDescription>Last 14 days</CardDescription>
                        </div>
                        <SectionLink href='/progress'>Progress</SectionLink>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className='aspect-auto h-[240px] w-full'>
                            <BarChart accessibilityLayer data={stats.chart} margin={{ left: 0, right: 8 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey='label' tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
                                <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                <Bar dataKey='minutes' fill='var(--color-minutes)' radius={[4, 4, 0, 0]} maxBarSize={28} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex-row items-start justify-between space-y-0'>
                        <div>
                            <CardTitle>Upcoming goals</CardTitle>
                            <CardDescription>Next 30 days</CardDescription>
                        </div>
                        <SectionLink href='/goals'>Goals</SectionLink>
                    </CardHeader>
                    <CardContent>
                        {eventsQuery.isLoading ? (
                            <p className='text-sm text-muted-foreground'>Loading…</p>
                        ) : upcoming.length === 0 ? (
                            <div className='space-y-2 text-sm text-muted-foreground'>
                                <p>Nothing planned yet.</p>
                                <Link href='/goals' className='font-medium text-primary hover:underline'>
                                    Plan a workout
                                </Link>
                            </div>
                        ) : (
                            <ul className='space-y-3'>
                                {upcoming.map((event) => (
                                    <li key={event.id} className='flex items-start gap-3'>
                                        <CalendarCheck className='mt-0.5 h-4 w-4 shrink-0 text-primary' aria-hidden='true' />
                                        <div className='min-w-0'>
                                            <p className='truncate text-sm font-medium'>{event.title}</p>
                                            <p className='text-xs text-muted-foreground'>
                                                {goalDay(event.start)} · {format(event.start, 'p')}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card className='lg:col-span-2'>
                    <CardHeader className='flex-row items-start justify-between space-y-0'>
                        <div>
                            <CardTitle>Recent workouts</CardTitle>
                            <CardDescription>From the mobile app</CardDescription>
                        </div>
                        <SectionLink href='/history'>History</SectionLink>
                    </CardHeader>
                    <CardContent>
                        {sessionsQuery.isLoading ? (
                            <p className='text-sm text-muted-foreground'>Loading…</p>
                        ) : recentSessions.length === 0 ? (
                            <p className='text-sm text-muted-foreground'>No workouts in the last 14 days.</p>
                        ) : (
                            <ul className='divide-y'>
                                {recentSessions.map((s) => (
                                    <li key={s.id} className='flex items-center justify-between py-2'>
                                        <div className='flex items-center gap-3'>
                                            <Badge variant='secondary'>{s.exercise}</Badge>
                                            <span className='text-sm text-muted-foreground'>
                                                {formatDistanceToNow(new Date(s.date), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <span className='text-sm font-medium tabular-nums'>{formatDuration(s.duration)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex-row items-start justify-between space-y-0'>
                        <div>
                            <CardTitle>Latest route</CardTitle>
                            <CardDescription>Last 30 days</CardDescription>
                        </div>
                        <SectionLink href='/tracking'>Tracking</SectionLink>
                    </CardHeader>
                    <CardContent>
                        {tracksQuery.isLoading ? (
                            <p className='text-sm text-muted-foreground'>Loading…</p>
                        ) : !lastTrack ? (
                            <p className='text-sm text-muted-foreground'>No routes recorded yet.</p>
                        ) : (
                            <div className='flex items-start gap-3'>
                                <MapPin className='mt-1 h-5 w-5 shrink-0 text-primary' aria-hidden='true' />
                                <div>
                                    <p className='text-2xl font-bold tabular-nums'>{lastTrack.distanceKm.toFixed(2)} km</p>
                                    <p className='text-sm text-muted-foreground'>
                                        {format(new Date(lastTrack.startedAt), 'EEE, d MMM · p')} ·{' '}
                                        {formatDuration((new Date(lastTrack.endedAt).getTime() - new Date(lastTrack.startedAt).getTime()) / 1000)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
