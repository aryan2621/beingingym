'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@auth0/nextjs-auth0';
import { format } from 'date-fns';
import { Loader2, LogOut, User } from 'lucide-react';

import BasicLayout from '@/layout/BasicLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { getMe } from '@/service/api';

export default function ProfilePage() {
    const { user, isLoading: userLoading } = useUser();
    const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe, enabled: !!user });

    const name = meQuery.data?.name ?? user?.name;
    const email = meQuery.data?.email ?? user?.email;
    const picture = meQuery.data?.picture ?? user?.picture;

    return (
        <BasicLayout>
            <div className='flex justify-center py-10'>
                {userLoading ? (
                    <Loader2 className='h-6 w-6 animate-spin' aria-label='Loading profile' />
                ) : (
                    <Card className='w-full max-w-md'>
                        <CardHeader className='flex-row items-center gap-4 space-y-0'>
                            {picture ? (
                                <Image src={picture} alt='' width={64} height={64} className='rounded-full' />
                            ) : (
                                <div className='flex h-16 w-16 items-center justify-center rounded-full bg-muted'>
                                    <User className='h-8 w-8' />
                                </div>
                            )}
                            <div className='min-w-0 flex-1'>
                                <CardTitle className='truncate'>{name}</CardTitle>
                                <CardDescription className='truncate'>{email}</CardDescription>
                            </div>
                            <IconButton label='Log out' variant='ghost' asChild>
                                <a href='/auth/logout'>
                                    <LogOut className='h-5 w-5' />
                                </a>
                            </IconButton>
                        </CardHeader>
                        <CardContent className='text-sm text-muted-foreground'>
                            {meQuery.data?.createdAt && <p>Member since {format(new Date(meQuery.data.createdAt), 'PP')}</p>}
                            {meQuery.isError && <p className='text-destructive'>Could not load your saved profile.</p>}
                        </CardContent>
                    </Card>
                )}
            </div>
        </BasicLayout>
    );
}
