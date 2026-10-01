import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import Providers from '@/utils/react-query';
import { ThemeProvider } from '@/providers/themeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import ProfileSync from '@/elements/ProfileSync';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
export const metadata: Metadata = {
    title: { default: 'BeingInGym', template: '%s · BeingInGym' },
    description: 'Record workouts and runs on your phone, then see your history, progress and goals on the web.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html suppressHydrationWarning lang='en'>
            <head />

            <body className={inter.className}>
                <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
                    <Providers>
                        <TooltipProvider delayDuration={200}>
                            {children}
                            <ProfileSync />
                            <Toaster />
                        </TooltipProvider>
                    </Providers>
                </ThemeProvider>
            </body>
        </html>
    );
}
