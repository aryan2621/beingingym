import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowRight,
    CalendarCheck,
    ChartColumn,
    Download,
    Flame,
    History,
    LayoutDashboard,
    MapPin,
    Play,
    Smartphone,
    type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Reveal } from '@/elements/Reveal';

const SIGN_UP_URL = '/auth/login?screen_hint=signup';

// Illustrative numbers for the hero preview; labelled "Sample data" in the UI.
const SAMPLE_WEEK = [35, 0, 50, 42, 0, 65, 30];

const FEATURES: { href: string; title: string; description: string; icon: LucideIcon }[] = [
    { href: '/history', title: 'History', description: 'Every workout, day by day.', icon: History },
    { href: '/progress', title: 'Progress', description: 'See your minutes add up.', icon: ChartColumn },
    { href: '/goals', title: 'Goals', description: 'Plan your week on a calendar.', icon: CalendarCheck },
    { href: '/tracking', title: 'Tracking', description: 'Distance and pace for every run.', icon: MapPin },
];

const STEPS: { title: string; text: string; icon: LucideIcon }[] = [
    { title: 'Record', text: 'Train with the BeingInGym mobile app.', icon: Smartphone },
    { title: 'Review', text: 'Your sessions show up here automatically.', icon: LayoutDashboard },
    { title: 'Improve', text: 'Plan the next week and keep the streak alive.', icon: Flame },
];

function MiniBars({ values }: { values: number[] }) {
    const max = Math.max(...values, 1);
    return (
        <div className='flex h-14 items-end gap-1.5' aria-hidden='true'>
            {values.map((v, i) => (
                <div
                    key={i}
                    className={v === 0 ? 'flex-1 rounded-t-[4px] bg-muted' : 'flex-1 rounded-t-[4px] bg-primary'}
                    style={{ height: `${Math.max((v / max) * 100, 6)}%` }}
                />
            ))}
        </div>
    );
}

export function Landing() {
    return (
        <div className='space-y-24'>
            {/* Hero */}
            <section className='relative -mt-4 overflow-hidden rounded-3xl border bg-gradient-to-br from-accent via-background to-background'>
                <div className='absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/15 blur-[120px]' aria-hidden='true' />

                <div className='relative grid items-center gap-12 px-6 py-16 sm:px-12 lg:grid-cols-[1.1fr_1fr] lg:py-20'>
                    <div>
                        <h1 className='text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl'>
                            Every rep. Every run. <span className='text-primary'>One dashboard.</span>
                        </h1>
                        <p className='mt-6 max-w-md text-lg text-muted-foreground'>Record on your phone. See your progress here.</p>
                        <div className='mt-8 flex flex-wrap gap-3'>
                            <Button size='lg' asChild>
                                {/* Plain anchor: /auth/* is handled by the Auth0 middleware. */}
                                <a href={SIGN_UP_URL}>
                                    Get started free
                                    <ArrowRight className='ml-2 h-4 w-4' aria-hidden='true' />
                                </a>
                            </Button>
                            <Button size='lg' variant='outline' asChild>
                                <Link href='/tutorial'>
                                    <Play className='mr-2 h-4 w-4' aria-hidden='true' />
                                    Tutorials
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Photo with product preview cards */}
                    <div className='relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto' aria-label='Dashboard preview with sample data'>
                        <div className='relative aspect-[4/3] overflow-hidden rounded-3xl border shadow-xl'>
                            <Image
                                src='/hero.jpeg'
                                alt='Athlete catching his breath in the gym'
                                fill
                                priority
                                sizes='(min-width: 1024px) 28rem, 100vw'
                                className='object-cover'
                            />
                        </div>
                        <div className='absolute -left-6 -top-6 hidden w-60 animate-float rounded-2xl border bg-card p-4 shadow-xl sm:block'>
                            <div className='flex items-center justify-between text-xs text-muted-foreground'>
                                <span>This week</span>
                                <span className='rounded-full bg-muted px-2 py-0.5'>Sample data</span>
                            </div>
                            <p className='mt-1 text-2xl font-bold tabular-nums'>3h 42m</p>
                            <div className='mt-3'>
                                <MiniBars values={SAMPLE_WEEK} />
                            </div>
                        </div>
                        <div
                            className='absolute -bottom-6 -right-4 hidden animate-float items-center gap-3 rounded-2xl border bg-card p-4 shadow-xl sm:flex'
                            style={{ animationDelay: '2s' }}
                        >
                            <span className='flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground'>
                                <Flame className='h-5 w-5' aria-hidden='true' />
                            </span>
                            <div>
                                <p className='text-xs text-muted-foreground'>Streak</p>
                                <p className='text-xl font-bold'>5 days</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section>
                <Reveal className='text-center'>
                    <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>Everything you train, in one place.</h2>
                </Reveal>
                <div className='mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                    {FEATURES.map(({ href, title, description, icon: Icon }, i) => (
                        <Reveal key={href} delay={i * 0.05}>
                            <Link
                                href={href}
                                className='group flex h-full flex-col rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            >
                                <span className='flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground'>
                                    <Icon className='h-5 w-5' aria-hidden='true' />
                                </span>
                                <h3 className='mt-5 flex items-center gap-1 text-lg font-semibold'>
                                    {title}
                                    <ArrowRight
                                        className='h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100'
                                        aria-hidden='true'
                                    />
                                </h3>
                                <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
                            </Link>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section>
                <Reveal className='text-center'>
                    <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>Train. Review. Improve.</h2>
                </Reveal>
                <ol className='mt-12 grid gap-10 md:grid-cols-3'>
                    {STEPS.map(({ title, text, icon: Icon }, i) => (
                        <Reveal key={title} delay={i * 0.1}>
                            <li className='flex flex-col items-center text-center'>
                                <span className='flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25'>
                                    <Icon className='h-6 w-6' aria-hidden='true' />
                                </span>
                                <h3 className='mt-5 text-lg font-semibold'>
                                    {i + 1}. {title}
                                </h3>
                                <p className='mt-1 max-w-xs text-muted-foreground'>{text}</p>
                            </li>
                        </Reveal>
                    ))}
                </ol>
            </section>

            {/* CTA */}
            <Reveal>
                <section className='relative overflow-hidden rounded-3xl bg-accent px-6 py-14 text-center'>
                    <div className='absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-[110px]' aria-hidden='true' />
                    <h2 className='relative text-3xl font-bold tracking-tight sm:text-4xl'>Free while we grow.</h2>
                    <p className='relative mt-3 text-muted-foreground'>Sign in with Google or email. No credit card.</p>
                    <div className='relative mt-8 flex flex-wrap justify-center gap-3'>
                        <Button size='lg' asChild>
                            <a href={SIGN_UP_URL}>
                                Create your free account
                                <ArrowRight className='ml-2 h-4 w-4' aria-hidden='true' />
                            </a>
                        </Button>
                        <Button size='lg' variant='outline' className='bg-background' asChild>
                            <Link href='/download'>
                                <Download className='mr-2 h-4 w-4' aria-hidden='true' />
                                Get the Android app
                            </Link>
                        </Button>
                    </div>
                </section>
            </Reveal>
        </div>
    );
}
