import React from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { Event } from '@/model/event';

type WeekViewProps = {
    date: Date;
    events: Event[];
    onEventClick: (events: Event[]) => void;
};

export function WeekView({ date, events, onEventClick }: WeekViewProps) {
    const weekStart = startOfWeek(date);

    return (
        <div className='grid grid-cols-7 gap-2 h-[60vh]'>
            {Array.from({ length: 7 }).map((_, index) => {
                const day = addDays(weekStart, index);
                const dayEvents = events.filter((event) => format(event.start, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));

                return (
                    <div key={index} className='border p-2 rounded-lg h-[100px]'>
                        <h4 className='font-semibold'>{format(day, 'EEE, MMM d')}</h4>
                        <div className='mt-2'>
                            <span className='text-lg font-bold'>{dayEvents.length}</span> events
                        </div>
                        {dayEvents.length > 0 && (
                            <button className='mt-2 text-sm text-primary hover:underline' onClick={() => onEventClick(dayEvents)}>
                                View events
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
