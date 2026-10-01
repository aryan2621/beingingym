import * as React from 'react';

// Public inbox for "Contact us"; NEXT_PUBLIC_CONTACT_EMAIL overrides it.
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'risha2621@gmail.com';

/** Opens a new message in the visitor's own Gmail with our address as the recipient. */
export const gmailComposeUrl = (subject = 'BeingInGym enquiry') =>
    `https://mail.google.com/mail/?${new URLSearchParams({ view: 'cm', fs: '1', to: CONTACT_EMAIL, su: subject })}`;

type ContactLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel'> & { subject?: string };

/** "Contact us" link that opens Gmail compose in a new tab. */
export const ContactLink = React.forwardRef<HTMLAnchorElement, ContactLinkProps>(({ subject, children, ...props }, ref) => {
    if (!CONTACT_EMAIL) return null;
    return (
        <a ref={ref} href={gmailComposeUrl(subject)} target='_blank' rel='noopener noreferrer' {...props}>
            {children}
        </a>
    );
});
ContactLink.displayName = 'ContactLink';
