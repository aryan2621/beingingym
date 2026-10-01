'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    // The theme is only known on the client; render a neutral icon until then to avoid a hydration mismatch.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const isDark = mounted && resolvedTheme === 'dark';
    return (
        <IconButton
            label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            variant='ghost'
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
            {isDark ? <Sun className='h-5 w-5' /> : <Moon className='h-5 w-5' />}
        </IconButton>
    );
}
