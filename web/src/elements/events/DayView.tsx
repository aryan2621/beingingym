import React from 'react';
import { format } from 'date-fns';
import { Event } from '@/model/event';

type DayViewProps = {
    date: Date;
    events: Event[];
    onEventClick: (events: Event[]) => void;
};

export function DayView({ date, events, onEventClick }: DayViewProps) {
    const dayEvents = events.filter((event) => format(event.start, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));

    return (
        <div className='space-y-4 h-[60vh]'>
            <h3 className='text-xl font-semibold'>{format(date, 'EEEE, MMMM d, yyyy')}</h3>
            {dayEvents.length === 0 ? (
                <p>No events scheduled for today.</p>
            ) : (
                dayEvents.map((event) => (
                    <div key={event.id} className='bg-accent text-accent-foreground p-3 rounded cursor-pointer' onClick={() => onEventClick([event])}>
                        <h4 className='font-semibold'>{event.title}</h4>
                        <p className='text-sm text-muted-foreground'>
                            {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                        </p>
                    </div>
                ))
            )}
        </div>
    );
}
