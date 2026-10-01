import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

type PageHeaderProps = {
    title: string;
    description?: React.ReactNode;
    icon?: LucideIcon;
    /** Filters or buttons shown on the right (below the title on small screens). */
    actions?: React.ReactNode;
};

/** Title row shared by every app page. */
export function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
    return (
        <div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
            <div className='flex items-start gap-3'>
                {Icon && (
                    <div className='mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground'>
                        <Icon className='h-5 w-5' aria-hidden='true' />
                    </div>
                )}
                <div>
                    <h1 className='text-3xl font-bold tracking-tight'>{title}</h1>
                    {description && <p className='mt-1 text-muted-foreground'>{description}</p>}
                </div>
            </div>
            {actions && <div className='flex flex-wrap items-center gap-2'>{actions}</div>}
        </div>
    );
}
