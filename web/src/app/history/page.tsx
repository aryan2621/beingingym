'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isToday, isYesterday, startOfDay, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, History as HistoryIcon, Loader2 } from 'lucide-react';

import BasicLayout from '@/layout/BasicLayout';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { listSessions } from '@/service/api';
import { Excercises, Exercise } from '@/utils/enum';

const RANGES = [
    { value: '7', label: '7 days' },
    { value: '30', label: '30 days' },
    { value: '90', label: '90 days' },
];

const PAGE_SIZE = 10;

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const dayLabel = (date: Date) => (isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'EEE, d MMM yyyy'));

export default function HistoryPage() {
    const [days, setDays] = useState('30');
    const [exercise, setExercise] = useState<Exercise | 'all'>('all');
    const [page, setPage] = useState(0);

    // Any filter change starts again from the newest page.
    const changeDays = (value: string) => {
        setDays(value);
        setPage(0);
    };
    const changeExercise = (value: Exercise | 'all') => {
        setExercise(value);
        setPage(0);
    };

    const sessionsQuery = useQuery({
        queryKey: ['sessions', days],
        queryFn: () => listSessions({ from: startOfDay(subDays(new Date(), Number(days) - 1)) }),
    });

    // Newest first.
    const sessions = useMemo(
        () => (sessionsQuery.data ?? []).filter((s) => exercise === 'all' || s.exercise === exercise).reverse(),
        [sessionsQuery.data, exercise]
    );

    const summary = useMemo(() => {
        const totalSeconds = sessions.reduce((sum, s) => sum + s.duration, 0);
        const counts = new Map<Exercise, number>();
        for (const s of sessions) counts.set(s.exercise, (counts.get(s.exercise) ?? 0) + 1);
        const top = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
        return { totalSeconds, top };
    }, [sessions]);

    const pageCount = Math.max(1, Math.ceil(sessions.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount - 1);
    const firstRow = currentPage * PAGE_SIZE;
    const rows = sessions.slice(firstRow, firstRow + PAGE_SIZE);

    return (
        <BasicLayout>
            <PageHeader
                title='History'
                description='Workouts recorded in the BeingInGym mobile app.'
                icon={HistoryIcon}
                actions={
                    <>
                        <Select value={exercise} onValueChange={(v) => changeExercise(v as Exercise | 'all')}>
                            <SelectTrigger className='w-40' aria-label='Filter by exercise'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>All exercises</SelectItem>
                                {Excercises.map((e) => (
                                    <SelectItem key={e} value={e}>
                                        {e}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Tabs value={days} onValueChange={changeDays}>
                            <TabsList>
                                {RANGES.map((r) => (
                                    <TabsTrigger key={r.value} value={r.value}>
                                        {r.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </>
                }
            />

            {sessionsQuery.isLoading && (
                <div className='flex justify-center py-20'>
                    <Loader2 className='h-6 w-6 animate-spin' aria-label='Loading history' />
                </div>
            )}
            {sessionsQuery.isError && <p className='text-sm text-destructive'>Could not load your history. Please refresh the page.</p>}

            {sessionsQuery.isSuccess && (
                <div className='space-y-6'>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                        <Card>
                            <CardHeader className='pb-2'>
                                <CardDescription>Sessions</CardDescription>
                                <CardTitle className='text-3xl tabular-nums'>{sessions.length}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className='pb-2'>
                                <CardDescription>Total time</CardDescription>
                                <CardTitle className='text-3xl tabular-nums'>{formatDuration(summary.totalSeconds)}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className='pb-2'>
                                <CardDescription>Most trained</CardDescription>
                                <CardTitle className='text-3xl'>{summary.top ?? '–'}</CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    <Card className='overflow-hidden'>
                        {sessions.length === 0 ? (
                            <CardContent className='py-10 text-center text-muted-foreground'>
                                No workouts in this period. Sessions you record in the BeingInGym mobile app show up here.
                            </CardContent>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader className='bg-muted/50'>
                                        <TableRow className='hover:bg-transparent'>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Exercise</TableHead>
                                            <TableHead className='text-right'>Duration</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((s) => {
                                            const date = new Date(s.date);
                                            return (
                                                <TableRow key={s.id}>
                                                    <TableCell className='font-medium'>{dayLabel(date)}</TableCell>
                                                    <TableCell className='text-muted-foreground tabular-nums'>{format(date, 'p')}</TableCell>
                                                    <TableCell>
                                                        <Badge variant='secondary'>{s.exercise}</Badge>
                                                    </TableCell>
                                                    <TableCell className='text-right font-medium tabular-nums'>
                                                        {formatDuration(s.duration)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>

                                <nav className='flex items-center justify-between gap-4 border-t px-4 py-3' aria-label='History pages'>
                                    <p className='text-sm text-muted-foreground tabular-nums' aria-live='polite'>
                                        Showing {firstRow + 1}–{firstRow + rows.length} of {sessions.length}
                                    </p>
                                    <div className='flex items-center gap-2'>
                                        <IconButton
                                            label='Previous page'
                                            size='sm'
                                            onClick={() => setPage(currentPage - 1)}
                                            disabled={currentPage === 0}
                                        >
                                            <ChevronLeft className='h-4 w-4' />
                                        </IconButton>
                                        <span className='min-w-20 text-center text-sm tabular-nums'>
                                            Page {currentPage + 1} of {pageCount}
                                        </span>
                                        <IconButton
                                            label='Next page'
                                            size='sm'
                                            onClick={() => setPage(currentPage + 1)}
                                            disabled={currentPage >= pageCount - 1}
                                        >
                                            <ChevronRight className='h-4 w-4' />
                                        </IconButton>
                                    </div>
                                </nav>
                            </>
                        )}
                    </Card>
                </div>
            )}
        </BasicLayout>
    );
}
