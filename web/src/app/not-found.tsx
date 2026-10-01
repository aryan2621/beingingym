import Link from 'next/link';
import { Dumbbell } from 'lucide-react';
import BasicLayout from '@/layout/BasicLayout';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <BasicLayout>
            <div className='flex flex-col items-center py-24 text-center'>
                <div className='flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-accent-foreground'>
                    <Dumbbell className='h-7 w-7' aria-hidden='true' />
                </div>
                <h1 className='mt-6 text-3xl font-bold tracking-tight'>Page not found</h1>
                <p className='mt-2 text-muted-foreground'>This page skipped leg day. Let&apos;s get you back on track.</p>
                <Button className='mt-8' asChild>
                    <Link href='/'>Go home</Link>
                </Button>
            </div>
        </BasicLayout>
    );
}
