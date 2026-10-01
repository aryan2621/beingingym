import { redirect } from 'next/navigation';

// Opens Auth0 Universal Login on its sign-up screen.
export default function SignUpPage() {
    redirect('/auth/login?screen_hint=signup');
}
