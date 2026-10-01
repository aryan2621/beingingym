import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { Event } from '@/model/event';

type MonthViewProps = {
    date: Date;
    events: Event[];
    onEventClick: (events: Event[]) => void;
};

export function MonthView({ date, events, onEventClick }: MonthViewProps) {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            const isCurrentMonth = day >= monthStart && day <= monthEnd;
            const dayEvents = isCurrentMonth ? events.filter((event) => format(event.start, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')) : [];

            days.push(
                <div key={day.toString()} className='border p-2 rounded-lg h-[80px]'>
                    {isCurrentMonth && (
                        <>
                            <div className='font-semibold'>{format(day, 'd')}</div>
                            {dayEvents.slice(0, 2).map((event) => (
                                <div
                                    key={event.id}
                                    className='p-1 mt-1 text-sm truncate cursor-pointer text-primary hover:underline'
                                    onClick={() => onEventClick([event])}
                                >
                                    {event.title}
                                </div>
                            ))}
                            {dayEvents.length > 2 && <div className='text-xs text-muted-foreground mt-1'>+{dayEvents.length - 2} more</div>}
                        </>
                    )}
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div key={day.toString()} className='grid grid-cols-7 gap-2'>
                {days}
            </div>
        );
        days = [];
    }

    return <div className='space-y-2 h-[60vh]'>{rows}</div>;
}
