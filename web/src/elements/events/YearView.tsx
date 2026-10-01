import React from 'react';
import { format, startOfYear, addMonths } from 'date-fns';
import { Event } from '@/model/event';

type YearViewProps = {
    date: Date;
    events: Event[];
    onEventClick: (events: Event[]) => void;
};

export function YearView({ date, events, onEventClick }: YearViewProps) {
    const yearStart = startOfYear(date);

    return (
        <div className='grid grid-cols-3 gap-4'>
            {Array.from({ length: 12 }).map((_, index) => {
                const monthDate = addMonths(yearStart, index);
                const monthEvents = events.filter((event) => format(event.start, 'yyyy-MM') === format(monthDate, 'yyyy-MM'));

                return (
                    <div key={index} className='border p-4 rounded-lg shadow-sm'>
                        <h3 className='font-semibold text-lg mb-2'>{format(monthDate, 'MMMM')}</h3>
                        <div className='text-2xl font-bold'>{monthEvents.length}</div>
                        <div className='text-sm text-muted-foreground'>events</div>
                        {monthEvents.length > 0 && (
                            <button className='mt-2 text-sm text-primary hover:underline' onClick={() => onEventClick(monthEvents)}>
                                View events
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
