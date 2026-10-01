import { CalendarCheck } from 'lucide-react';
import { EventCalendar } from '@/elements/events/EventComponent';
import { PageHeader } from '@/components/page-header';
import BasicLayout from '@/layout/BasicLayout';

export default function GoalsPage() {
    return (
        <BasicLayout>
            <PageHeader
                title='Goals'
                description='Plan your workouts and milestones. This is the one page you edit on the web.'
                icon={CalendarCheck}
            />
            <EventCalendar />
        </BasicLayout>
    );
}
