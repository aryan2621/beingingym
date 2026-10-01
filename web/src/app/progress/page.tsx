'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { ChartColumn, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

import BasicLayout from '@/layout/BasicLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getProgress } from '@/service/api';
import { Progress, ProgressModes } from '@/utils/enum';

const RANGE_COPY: Record<Progress, { span: string; bucket: string }> = {
    [Progress.Daily]: { span: 'Last 14 days', bucket: 'Per day' },
    [Progress.Weekly]: { span: 'Last 12 weeks', bucket: 'Per week' },
    [Progress.Monthly]: { span: 'Last 12 months', bucket: 'Per month' },
};

const chartConfig = {
    minutes: { label: 'Minutes', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const toMinutes = (seconds: number) => Math.round((seconds / 60) * 10) / 10;

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const bucketLabel = (range: Progress, bucket: string) => {
    if (range === Progress.Monthly) return format(parseISO(`${bucket}-01`), 'MMM');
    return format(parseISO(bucket), 'd MMM');
};

export default function ProgressPage() {
    const [range, setRange] = React.useState<Progress>(Progress.Daily);
    const progressQuery = useQuery({ queryKey: ['progress', range], queryFn: () => getProgress(range) });
    const data = progressQuery.data;

    const series = (data?.series ?? []).map((b) => ({ label: bucketLabel(range, b.bucket), minutes: toMinutes(b.seconds), sessions: b.sessions }));
    const byExercise = [...(data?.byExercise ?? [])]
        .sort((a, b) => b.seconds - a.seconds)
        .map((e) => ({ exercise: e.exercise, minutes: toMinutes(e.seconds) }));

    return (
        <BasicLayout>
            <PageHeader
                title='Progress'
                description='Your workout minutes over time and where they go.'
                icon={ChartColumn}
                actions={
                    <Tabs value={range} onValueChange={(value) => setRange(value as Progress)}>
                        <TabsList>
                            {ProgressModes.map((mode) => (
                                <TabsTrigger key={mode} value={mode}>
                                    {mode}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                }
            />

            {progressQuery.isLoading && (
                <div className='flex justify-center py-20'>
                    <Loader2 className='h-6 w-6 animate-spin' aria-label='Loading progress' />
                </div>
            )}
            {progressQuery.isError && <p className='text-sm text-destructive'>Could not load your progress. Please refresh the page.</p>}

            {data && (
                <div className='space-y-6'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <Card>
                            <CardHeader className='pb-2'>
                                <CardDescription>Total time · {RANGE_COPY[range].span}</CardDescription>
                                <CardTitle className='text-3xl tabular-nums'>{formatDuration(data.totalSeconds)}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className='pb-2'>
                                <CardDescription>Sessions · {RANGE_COPY[range].span}</CardDescription>
                                <CardTitle className='text-3xl tabular-nums'>{data.sessionCount}</CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    {data.sessionCount === 0 ? (
                        <Card>
                            <CardContent className='py-10 text-center text-muted-foreground'>
                                No sessions in this period yet. Workouts you record in the BeingInGym mobile app show up here.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Workout minutes</CardTitle>
                                    <CardDescription>
                                        {RANGE_COPY[range].bucket} · {RANGE_COPY[range].span}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={chartConfig} className='aspect-auto h-[260px] w-full'>
                                        <BarChart accessibilityLayer data={series} margin={{ left: 0, right: 8 }}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey='label' tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
                                            <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                            <Bar dataKey='minutes' fill='var(--color-minutes)' radius={[4, 4, 0, 0]} maxBarSize={32} />
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Minutes by exercise</CardTitle>
                                    <CardDescription>{RANGE_COPY[range].span}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={chartConfig} className='aspect-auto h-[260px] w-full'>
                                        <BarChart accessibilityLayer data={byExercise} layout='vertical' margin={{ left: 0, right: 40 }}>
                                            <YAxis dataKey='exercise' type='category' tickLine={false} axisLine={false} width={72} />
                                            <XAxis type='number' hide />
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                            <Bar dataKey='minutes' fill='var(--color-minutes)' radius={[0, 4, 4, 0]} maxBarSize={20}>
                                                <LabelList dataKey='minutes' position='right' className='fill-muted-foreground' fontSize={12} />
                                            </Bar>
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </BasicLayout>
    );
}
