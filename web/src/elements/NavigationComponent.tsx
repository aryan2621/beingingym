'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0';
import {
    CalendarCheck,
    ChartColumn,
    ChevronDown,
    Download,
    Dumbbell,
    History,
    Info,
    LayoutDashboard,
    LogIn,
    LogOut,
    Mail,
    MapPin,
    Menu,
    User,
    UserPlus,
    Youtube,
    type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IconButton } from '@/components/ui/icon-button';
import { CONTACT_EMAIL, ContactLink } from '@/elements/ContactLink';
import { ThemeToggle } from '@/elements/ThemeToggle';
import { cn } from '@/lib/utils';

type NavLink = { href: string; label: string; icon: LucideIcon };

const PUBLIC_LINKS: NavLink[] = [
    { href: '/', label: 'Home', icon: LayoutDashboard },
    { href: '/tutorial', label: 'Tutorials', icon: Youtube },
    { href: '/download', label: 'Get the app', icon: Download },
    { href: '/about', label: 'About', icon: Info },
];

const APP_LINKS: NavLink[] = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/progress', label: 'Progress', icon: ChartColumn },
    { href: '/goals', label: 'Goals', icon: CalendarCheck },
    { href: '/tracking', label: 'Tracking', icon: MapPin },
    { href: '/tutorial', label: 'Tutorials', icon: Youtube },
];

const isActive = (pathname: string, href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));

const NavigationComponent = () => {
    const { user, isLoading } = useUser();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const links = user ? APP_LINKS : PUBLIC_LINKS;

    return (
        <header className='fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4'>
                <div className='flex items-center gap-2'>
                    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                        <SheetTrigger asChild>
                            <IconButton label='Open menu' variant='ghost' className='md:hidden'>
                                <Menu className='h-5 w-5' />
                            </IconButton>
                        </SheetTrigger>
                        <SheetContent side='left' className='w-72'>
                            <SheetHeader>
                                <SheetTitle className='flex items-center gap-2'>
                                    <Dumbbell className='h-5 w-5 text-primary' aria-hidden='true' />
                                    BeingInGym
                                </SheetTitle>
                            </SheetHeader>
                            <nav className='mt-6 flex flex-col gap-1' aria-label='Main'>
                                {links.map(({ href, label, icon: Icon }) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={() => setMenuOpen(false)}
                                        aria-current={isActive(pathname, href) ? 'page' : undefined}
                                        className={cn(
                                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                                            isActive(pathname, href) && 'bg-accent text-accent-foreground'
                                        )}
                                    >
                                        <Icon className='h-4 w-4' aria-hidden='true' />
                                        {label}
                                    </Link>
                                ))}
                            </nav>
                            <div className='mt-6 border-t pt-6'>
                                {/* Plain anchors: /auth/* routes are handled by the Auth0 middleware, not the Next router. */}
                                {user ? (
                                    <a
                                        href='/auth/logout'
                                        className='flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10'
                                    >
                                        <LogOut className='h-4 w-4' aria-hidden='true' />
                                        Log out
                                    </a>
                                ) : (
                                    <div className='flex flex-col gap-2'>
                                        <Button variant='outline' asChild>
                                            <a href='/auth/login'>
                                                <LogIn className='mr-2 h-4 w-4' aria-hidden='true' />
                                                Log in
                                            </a>
                                        </Button>
                                        <Button asChild>
                                            <a href='/auth/login?screen_hint=signup'>
                                                <UserPlus className='mr-2 h-4 w-4' aria-hidden='true' />
                                                Sign up
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Link href='/' className='flex items-center gap-2 font-bold tracking-tight' prefetch={false}>
                        <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
                            <Dumbbell className='h-5 w-5' aria-hidden='true' />
                        </span>
                        <span className='text-lg'>BeingInGym</span>
                    </Link>
                </div>

                <nav className='hidden items-center gap-1 md:flex' aria-label='Main'>
                    {links.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            prefetch={false}
                            aria-current={isActive(pathname, href) ? 'page' : undefined}
                            className={cn(
                                'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                                isActive(pathname, href) && 'bg-accent text-accent-foreground hover:text-accent-foreground'
                            )}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                <div className='flex items-center gap-1'>
                    <ThemeToggle />
                    {isLoading ? (
                        <div className='h-10 w-24' aria-hidden='true' />
                    ) : user ? (
                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant='ghost' className='h-10 gap-2 rounded-full px-1.5 sm:pr-3' aria-label='Account menu'>
                                            {user.picture ? (
                                                <Image src={user.picture} alt='' width={28} height={28} className='rounded-full' />
                                            ) : (
                                                <span className='flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground'>
                                                    <User className='h-4 w-4' />
                                                </span>
                                            )}
                                            <span className='hidden max-w-[8rem] truncate text-sm font-medium sm:inline'>
                                                {user.given_name ?? user.name?.split(' ')[0] ?? 'Account'}
                                            </span>
                                            <ChevronDown className='hidden h-4 w-4 text-muted-foreground sm:inline' aria-hidden='true' />
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>Account</TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent align='end' className='w-56'>
                                <DropdownMenuLabel className='font-normal'>
                                    <p className='truncate text-sm font-medium'>{user.name}</p>
                                    <p className='truncate text-xs text-muted-foreground'>{user.email}</p>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href='/profile'>
                                        <User className='mr-2 h-4 w-4' />
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href='/download'>
                                        <Download className='mr-2 h-4 w-4' />
                                        Get the app
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href='/about'>
                                        <Info className='mr-2 h-4 w-4' />
                                        About
                                    </Link>
                                </DropdownMenuItem>
                                {CONTACT_EMAIL && (
                                    <DropdownMenuItem asChild>
                                        <ContactLink>
                                            <Mail className='mr-2 h-4 w-4' />
                                            Contact
                                        </ContactLink>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild className='text-destructive focus:bg-destructive/10 focus:text-destructive'>
                                    {/* Plain anchor: /auth/* routes are handled by the Auth0 middleware, not the Next router. */}
                                    <a href='/auth/logout'>
                                        <LogOut className='mr-2 h-4 w-4' aria-hidden='true' />
                                        Log out
                                    </a>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className='flex items-center gap-2'>
                            {/* Plain anchors: /auth/* routes are handled by the Auth0 middleware, not the Next router. */}
                            <Button variant='outline' className='h-9 px-3' asChild>
                                <a href='/auth/login'>
                                    <LogIn className='mr-2 h-4 w-4 shrink-0' aria-hidden='true' />
                                    Log in
                                </a>
                            </Button>
                            <Button className='hidden h-9 px-3 sm:inline-flex' asChild>
                                <a href='/auth/login?screen_hint=signup'>
                                    <UserPlus className='mr-2 h-4 w-4 shrink-0' aria-hidden='true' />
                                    Sign up
                                </a>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default NavigationComponent;
