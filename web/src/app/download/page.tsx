'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Download, ExternalLink, ScanLine, ShieldCheck, Smartphone, Timer, MapPin } from 'lucide-react';

import BasicLayout from '@/layout/BasicLayout';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/elements/Reveal';
import { APK_URL, RELEASES_URL } from '@/lib/app-download';

const STEPS = [
    { title: 'Download', text: 'Scan the code or tap Download APK on your Android phone.' },
    { title: 'Allow the install', text: 'If Android asks, allow installs from your browser for this one file.' },
    { title: 'Sign in', text: 'Open BeingInGym and log in with the same account you use here.' },
];

export default function DownloadPage() {
    return (
        <BasicLayout>
            <div className='mx-auto max-w-5xl space-y-20'>
                <section className='grid items-center gap-12 md:grid-cols-[1.2fr_1fr]'>
                    <Reveal>
                        <p className='text-sm font-semibold uppercase tracking-widest text-primary'>Get the app</p>
                        <h1 className='mt-3 text-5xl font-extrabold leading-[1.05] tracking-tight'>Your gym, in your pocket.</h1>
                        <p className='mt-5 max-w-md text-lg text-muted-foreground'>
                            Time your workouts and track your runs. Everything syncs to your dashboard here.
                        </p>
                        <ul className='mt-6 space-y-2 text-sm'>
                            <li className='flex items-center gap-2'>
                                <Timer className='h-4 w-4 text-primary' aria-hidden='true' />
                                Workout timer and stopwatch
                            </li>
                            <li className='flex items-center gap-2'>
                                <MapPin className='h-4 w-4 text-primary' aria-hidden='true' />
                                GPS tracking for runs and walks
                            </li>
                        </ul>
                        <div className='mt-8 flex flex-wrap gap-3'>
                            <Button size='lg' asChild>
                                <a href={APK_URL}>
                                    <Download className='mr-2 h-4 w-4' aria-hidden='true' />
                                    Download APK
                                </a>
                            </Button>
                            <Button size='lg' variant='outline' asChild>
                                <a href={RELEASES_URL} target='_blank' rel='noopener noreferrer'>
                                    All releases
                                    <ExternalLink className='ml-2 h-4 w-4' aria-hidden='true' />
                                </a>
                            </Button>
                        </div>
                        <p className='mt-4 flex items-center gap-2 text-xs text-muted-foreground'>
                            <Smartphone className='h-3.5 w-3.5' aria-hidden='true' />
                            Android only for now. iPhone support is planned.
                        </p>
                    </Reveal>

                    {/* QR only helps on a laptop; on a phone the button above is the way. */}
                    <Reveal delay={0.1} className='hidden md:block'>
                        <div className='mx-auto w-fit rounded-3xl border bg-card p-6 text-center shadow-xl'>
                            {/* White plate keeps the code scannable in dark mode. */}
                            <div className='rounded-2xl bg-white p-4'>
                                <QRCodeSVG
                                    value={APK_URL}
                                    size={208}
                                    level='M'
                                    marginSize={0}
                                    aria-label='QR code to download the BeingInGym Android app'
                                />
                            </div>
                            <p className='mt-4 flex items-center justify-center gap-2 text-sm font-medium'>
                                <ScanLine className='h-4 w-4 text-primary' aria-hidden='true' />
                                Scan with your phone camera
                            </p>
                        </div>
                    </Reveal>
                </section>

                <section>
                    <Reveal>
                        <h2 className='text-center text-3xl font-bold tracking-tight'>Install in three steps</h2>
                    </Reveal>
                    <ol className='mt-10 grid gap-4 md:grid-cols-3'>
                        {STEPS.map(({ title, text }, i) => (
                            <Reveal key={title} delay={i * 0.05}>
                                <li className='h-full rounded-2xl border bg-card p-6'>
                                    <span className='flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground'>
                                        {i + 1}
                                    </span>
                                    <h3 className='mt-4 font-semibold'>{title}</h3>
                                    <p className='mt-1 text-sm text-muted-foreground'>{text}</p>
                                </li>
                            </Reveal>
                        ))}
                    </ol>
                    <p className='mt-8 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground'>
                        <ShieldCheck className='h-4 w-4 text-primary' aria-hidden='true' />
                        Official builds are published on the BeingInGym GitHub Releases page.
                    </p>
                </section>
            </div>
        </BasicLayout>
    );
}
