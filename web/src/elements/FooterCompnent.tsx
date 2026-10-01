import Link from 'next/link';
import { Github } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ContactLink } from '@/elements/ContactLink';

const FooterComponent = () => {
    return (
        <footer className='py-6 border-t'>
            <div className='container mx-auto px-4'>
                <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
                    <p className='text-sm'>© {new Date().getFullYear()} BeingInGym. All rights reserved.</p>
                    <div className='flex items-center gap-4 text-sm'>
                        <Link href='/about' className='hover:underline'>
                            About
                        </Link>
                        <ContactLink className='hover:underline'>Contact</ContactLink>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <a href='https://github.com/aryan2621/beingingym' target='_blank' rel='noopener noreferrer' aria-label='GitHub'>
                                    <Github className='h-5 w-5' />
                                </a>
                            </TooltipTrigger>
                            <TooltipContent>GitHub</TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default FooterComponent;
