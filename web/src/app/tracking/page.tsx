'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import { Filter, Loader2, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { IconButton } from '@/components/ui/icon-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listTracks } from '@/service/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { differenceInSeconds, format } from 'date-fns';
import BasicLayout from '@/layout/BasicLayout';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

// Elapsed seconds as HH:mm:ss (not via Date, which would shift by the local timezone).
const formatElapsed = (seconds: number) =>
    [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map((n) => n.toString().padStart(2, '0')).join(':');

const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
};

export default function Component() {
    const [startTime, setStartTime] = useState<Date | undefined>(() => subDays(new Date(), 7));
    const [endTime, setEndTime] = useState<Date | undefined>(() => new Date());
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [appliedRange, setAppliedRange] = useState(() => ({ from: startOfDay(subDays(new Date(), 7)), to: endOfDay(new Date()) }));
    const [selectedTrackId, setSelectedTrackId] = useState<string | undefined>();

    const tracksQuery = useQuery({
        queryKey: ['tracks', appliedRange.from.toISOString(), appliedRange.to.toISOString()],
        queryFn: () => listTracks(appliedRange),
    });
    const tracks = useMemo(() => tracksQuery.data ?? [], [tracksQuery.data]);
    // Default to the most recent track in the range.
    const selectedTrack = tracks.find((t) => t.id === selectedTrackId) ?? tracks[tracks.length - 1];

    const filteredCoordinates = useMemo(
        () => (selectedTrack?.points ?? []).map((p) => ({ lat: p.lat, lng: p.lng, timestamp: new Date(p.timestamp) })),
        [selectedTrack]
    );

    const { totalDistance, maxSpeed, avgSpeed, timeTaken } = useMemo(() => {
        if (filteredCoordinates.length < 2) {
            return { totalDistance: 0, maxSpeed: 0, avgSpeed: 0, timeTaken: 0 };
        }

        let totalDistance = 0;
        let maxSpeed = 0;
        const timeTaken = differenceInSeconds(filteredCoordinates[filteredCoordinates.length - 1].timestamp, filteredCoordinates[0].timestamp);

        for (let i = 1; i < filteredCoordinates.length; i++) {
            const prevCoord = filteredCoordinates[i - 1];
            const currCoord = filteredCoordinates[i];
            const segmentDistance = calculateDistance(prevCoord.lat, prevCoord.lng, currCoord.lat, currCoord.lng);
            totalDistance += segmentDistance;

            const segmentTime = differenceInSeconds(currCoord.timestamp, prevCoord.timestamp);
            if (segmentTime > 0) {
                const segmentSpeed = (segmentDistance / segmentTime) * 3600; // km/h
                maxSpeed = Math.max(maxSpeed, segmentSpeed);
            }
        }

        const avgSpeed = timeTaken > 0 ? (totalDistance / timeTaken) * 3600 : 0; // km/h

        return {
            totalDistance: parseFloat(totalDistance.toFixed(2)),
            maxSpeed: parseFloat(maxSpeed.toFixed(2)),
            avgSpeed: parseFloat(avgSpeed.toFixed(2)),
            timeTaken,
        };
    }, [filteredCoordinates]);

    const handleApplyFilters = () => {
        if (startTime && endTime && startTime <= endTime) {
            setAppliedRange({ from: startOfDay(startTime), to: endOfDay(endTime) });
            setSelectedTrackId(undefined);
        }
        setIsFilterOpen(false);
    };

    return (
        <BasicLayout>
            <PageHeader title='Tracking' description='Routes you record with the BeingInGym mobile app.' icon={MapPin} />
            <div>
                <div className='flex items-center justify-between gap-4 mb-4'>
                    {tracks.length > 0 ? (
                        <Select value={selectedTrack?.id} onValueChange={setSelectedTrackId}>
                            <SelectTrigger className='w-72'>
                                <SelectValue placeholder='Select a track' />
                            </SelectTrigger>
                            <SelectContent>
                                {[...tracks].reverse().map((track) => (
                                    <SelectItem key={track.id} value={track.id}>
                                        {format(new Date(track.startedAt), 'PP p')} · {track.distanceKm.toFixed(2)} km
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <span />
                    )}
                    <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <SheetTrigger asChild>
                            <IconButton label='Filter by date'>
                                <Filter className='h-4 w-4' />
                            </IconButton>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Filter Options</SheetTitle>
                            </SheetHeader>
                            <div className='space-y-4 mt-4'>
                                <div className='space-y-2'>
                                    <Label>Start Date</Label>
                                    <Calendar mode='single' selected={startTime} onSelect={setStartTime} className='rounded-md border' />
                                </div>
                                <div className='space-y-2'>
                                    <Label>End Date</Label>
                                    <Calendar mode='single' selected={endTime} onSelect={setEndTime} className='rounded-md border' />
                                </div>
                                <Button onClick={handleApplyFilters} disabled={!startTime || !endTime || startTime > endTime}>
                                    Apply Filters
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {tracksQuery.isLoading && (
                    <div className='flex justify-center py-20'>
                        <Loader2 className='h-6 w-6 animate-spin' aria-label='Loading tracks' />
                    </div>
                )}
                {tracksQuery.isError && <p className='mb-4 text-sm text-destructive'>Could not load your tracks. Please refresh the page.</p>}
                {tracksQuery.isSuccess && tracks.length === 0 && (
                    <Card className='mb-4'>
                        <CardContent className='py-10 text-center text-muted-foreground'>
                            No tracks in this period. Routes are recorded from the BeingInGym mobile app.
                        </CardContent>
                    </Card>
                )}

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                    <Card>
                        <CardHeader>
                            <CardTitle>Total Distance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className='text-2xl font-bold'>{totalDistance} km</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Max Speed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className='text-2xl font-bold'>{maxSpeed} km/h</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Avg Speed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className='text-2xl font-bold'>{avgSpeed} km/h</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Time Taken</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className='text-2xl font-bold'>{formatElapsed(timeTaken)}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </BasicLayout>
    );
}
