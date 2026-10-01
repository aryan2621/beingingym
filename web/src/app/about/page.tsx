import Image from 'next/image';
import { ArrowRight, Feather, LockKeyhole, Target, type LucideIcon } from 'lucide-react';

import BasicLayout from '@/layout/BasicLayout';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CONTACT_EMAIL, ContactLink } from '@/elements/ContactLink';
import { Reveal } from '@/elements/Reveal';

const VALUES: { title: string; description: string; icon: LucideIcon }[] = [
    { title: 'Simple', description: 'Open, train, done. No clutter.', icon: Feather },
    { title: 'Honest', description: 'Charts show exactly what you recorded.', icon: Target },
    { title: 'Private', description: 'Your workouts are shown only to you.', icon: LockKeyhole },
];

const FAQS = [
    {
        q: 'How do I log a workout?',
        a: 'Workouts are recorded in the BeingInGym mobile app. Pick the exercise, use the timer or stopwatch and save. The session then appears on the History and Progress pages here on the web.',
    },
    {
        q: 'What can I do on the web?',
        a: 'See your history, progress and routes, watch tutorials, and plan your goals on the calendar. Goals are the one thing you edit on the web.',
    },
    {
        q: 'Do I need an account to watch tutorials?',
        a: 'No. Tutorials are open to everyone. Sign in with Google or email and password to see your own history, progress and goals.',
    },
    {
        q: 'Is it free?',
        a: 'Yes. Everything BeingInGym offers today is free to use.',
    },
];

export default function AboutPage() {
    return (
        <BasicLayout>
            <div className='space-y-24'>
                {/* Hero */}
                <section className='grid items-center gap-12 lg:grid-cols-2'>
                    <Reveal>
                        <p className='text-sm font-semibold uppercase tracking-widest text-primary'>About</p>
                        <h1 className='mt-3 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl'>
                            Built for people who would rather <span className='text-primary'>train</span> than track.
                        </h1>
                        <p className='mt-6 max-w-md text-lg text-muted-foreground'>
                            Your phone records the work. BeingInGym turns it into progress you can see.
                        </p>
                        <Button size='lg' className='mt-8' asChild>
                            {/* Plain anchor: /auth/* is handled by the Auth0 middleware. */}
                            <a href='/auth/login?screen_hint=signup'>
                                Start your journey
                                <ArrowRight className='ml-2 h-4 w-4' aria-hidden='true' />
                            </a>
                        </Button>
                    </Reveal>
                    <Reveal delay={0.1} className='relative mx-auto aspect-[4/5] w-full max-w-sm'>
                        <div className='absolute -inset-6 -z-10 rounded-[2rem] bg-primary/10 blur-2xl' aria-hidden='true' />
                        <Image
                            src='/Bannr.jpeg'
                            alt='Runner on a lakeside path at dawn'
                            fill
                            sizes='384px'
                            className='rounded-3xl border object-cover shadow-xl'
                        />
                    </Reveal>
                </section>

                {/* Manifesto */}
                <Reveal>
                    <p className='mx-auto max-w-3xl text-center text-3xl font-bold leading-tight tracking-tight sm:text-4xl'>
                        The phone records. The web reflects. <span className='text-primary'>You improve.</span>
                    </p>
                </Reveal>

                {/* Values */}
                <section className='grid gap-4 sm:grid-cols-3'>
                    {VALUES.map(({ title, description, icon: Icon }, i) => (
                        <Reveal key={title} delay={i * 0.05}>
                            <div className='h-full rounded-2xl border bg-card p-6 text-center'>
                                <span className='mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground'>
                                    <Icon className='h-5 w-5' aria-hidden='true' />
                                </span>
                                <h3 className='mt-4 text-lg font-semibold'>{title}</h3>
                                <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
                            </div>
                        </Reveal>
                    ))}
                </section>

                {/* FAQ */}
                <section className='mx-auto max-w-2xl'>
                    <Reveal className='text-center'>
                        <h2 className='text-3xl font-bold tracking-tight'>Questions, answered.</h2>
                    </Reveal>
                    <Reveal delay={0.1} className='mt-8'>
                        <Accordion type='single' collapsible className='w-full'>
                            {FAQS.map((faq, i) => (
                                <AccordionItem key={faq.q} value={`item-${i}`}>
                                    <AccordionTrigger className='text-left text-base'>{faq.q}</AccordionTrigger>
                                    <AccordionContent className='text-muted-foreground'>{faq.a}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </Reveal>
                    {CONTACT_EMAIL && (
                        <p className='mt-8 text-center text-muted-foreground'>
                            Something else? <ContactLink className='font-medium text-primary hover:underline'>Write to us</ContactLink>
                        </p>
                    )}
                </section>
            </div>
        </BasicLayout>
    );
}
