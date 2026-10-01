'use client';

import { useUser } from '@auth0/nextjs-auth0';
import { Loader2 } from 'lucide-react';

import BasicLayout from '@/layout/BasicLayout';
import { Dashboard } from '@/elements/home/Dashboard';
import { Landing } from '@/elements/home/Landing';

// Signed-in visitors get their dashboard; everyone else sees the landing page.
export default function Home() {
    const { user, isLoading } = useUser();

    return (
        <BasicLayout>
            {isLoading ? (
                <div className='flex justify-center py-32'>
                    <Loader2 className='h-6 w-6 animate-spin' aria-label='Loading' />
                </div>
            ) : user ? (
                <Dashboard name={user.name ?? undefined} />
            ) : (
                <Landing />
            )}
        </BasicLayout>
    );
}
