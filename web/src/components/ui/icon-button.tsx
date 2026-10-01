'use client';

import * as React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface IconButtonProps extends ButtonProps {
    /** Shown in the tooltip and used as the accessible name. */
    label: string;
}

/** Icon-only button that always shows a styled tooltip with its label. */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(({ label, size = 'icon', variant = 'outline', children, ...props }, ref) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button ref={ref} size={size} variant={variant} aria-label={label} {...props}>
                {children}
            </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
    </Tooltip>
));
IconButton.displayName = 'IconButton';

export { IconButton };
