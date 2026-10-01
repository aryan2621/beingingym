'use client';

import React, { useState, useMemo } from 'react';
import { format, addDays, addMonths, subMonths, subYears, addYears, startOfYear } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Event } from '@/model/event';
import { createEvent, deleteEvent, listEvents, updateEvent } from '@/service/api';

import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { EventModal } from './EventAction';
import { MonthView } from './MonthView';
import { YearView } from './YearView';

type ViewType = 'day' | 'week' | 'month' | 'year';

export function EventCalendar() {
    const [date, setDate] = useState<Date>(new Date());
    const [view, setView] = useState<ViewType>('month');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Load the whole visible year (plus a week either side for week views that cross the boundary).
    const year = date.getFullYear();
    const eventsQuery = useQuery({
        queryKey: ['events', year],
        queryFn: () => {
            const yearStart = startOfYear(date);
            return listEvents({ from: addDays(yearStart, -7), to: addDays(addYears(yearStart, 1), 7) });
        },
    });
    const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['events'] });
    const onError = () => toast({ variant: 'destructive', title: 'Something went wrong', description: 'Your change was not saved.' });

    const saveMutation = useMutation({
        mutationFn: ({ event, id }: { event: Omit<Event, 'id'>; id?: string }) => (id ? updateEvent({ ...event, id }) : createEvent(event)),
        onSuccess: invalidate,
        onError,
    });
    const deleteMutation = useMutation({ mutationFn: deleteEvent, onSuccess: invalidate, onError });

    // Resolve the selection against live data so deleted events drop out of the open modal.
    const selectedEvents = useMemo(() => (selectedIds ? events.filter((e) => selectedIds.includes(e.id)) : null), [events, selectedIds]);

    const handlePrevious = () => {
        if (view === 'day') setDate(addDays(date, -1));
        if (view === 'week') setDate(addDays(date, -7));
        if (view === 'month') setDate(subMonths(date, 1));
        if (view === 'year') setDate(subYears(date, 1));
    };

    const handleNext = () => {
        if (view === 'day') setDate(addDays(date, 1));
        if (view === 'week') setDate(addDays(date, 7));
        if (view === 'month') setDate(addMonths(date, 1));
        if (view === 'year') setDate(addYears(date, 1));
    };

    const handleYearChange = (year: string) => {
        const newDate = new Date(date);
        newDate.setFullYear(parseInt(year));
        setDate(newDate);
    };

    const openModal = (events: Event[] | null = null) => {
        setSelectedIds(events ? events.map((e) => e.id) : null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedIds(null);
        setIsModalOpen(false);
    };

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
    }, []);

    return (
        <div className='w-full rounded-xl border bg-card p-4'>
            <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
                <div className='flex flex-wrap items-center gap-2'>
                    <IconButton label='Previous' onClick={handlePrevious}>
                        <ChevronLeft className='h-4 w-4' />
                    </IconButton>
                    <IconButton label='Next' onClick={handleNext}>
                        <ChevronRight className='h-4 w-4' />
                    </IconButton>
                    <h2 className='text-2xl font-bold'>{format(date, 'MMMM yyyy')}</h2>
                    {eventsQuery.isFetching && <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' aria-label='Loading events' />}
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                    <Select onValueChange={(value: ViewType) => setView(value)} defaultValue={'month'}>
                        <SelectTrigger className='w-[130px]' aria-label='Calendar view'>
                            <SelectValue placeholder='Select view' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='day'>Day</SelectItem>
                            <SelectItem value='week'>Week</SelectItem>
                            <SelectItem value='month'>Month</SelectItem>
                            <SelectItem value='year'>Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select onValueChange={handleYearChange}>
                        <SelectTrigger className='w-[100px]' aria-label='Year'>
                            <SelectValue placeholder='Year' />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Popover>
                        <PopoverTrigger asChild>
                            <IconButton label='Pick a date'>
                                <CalendarIcon className='h-4 w-4' />
                            </IconButton>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0'>
                            <Calendar mode='single' selected={date} onSelect={(newDate) => newDate && setDate(newDate)} autoFocus />
                        </PopoverContent>
                    </Popover>
                    <Button onClick={() => openModal()}>Add Event</Button>
                </div>
            </div>
            {view === 'day' && <DayView date={date} events={events} onEventClick={openModal} />}
            {view === 'week' && <WeekView date={date} events={events} onEventClick={openModal} />}
            {view === 'month' && <MonthView date={date} events={events} onEventClick={openModal} />}
            {view === 'year' && <YearView date={date} events={events} onEventClick={openModal} />}
            {eventsQuery.isError && <p className='mt-4 text-sm text-destructive'>Could not load your events. Please refresh the page.</p>}
            <EventModal
                isOpen={isModalOpen}
                onClose={closeModal}
                events={selectedEvents}
                onSave={(event, id) => saveMutation.mutateAsync({ event, id })}
                onDelete={(id) => deleteMutation.mutateAsync(id)}
            />
        </div>
    );
}
