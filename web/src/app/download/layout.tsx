import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Get the app' };

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
