import { redirect } from 'next/navigation';

// Login is handled by Auth0 Universal Login (Google + email/password).
export default function SignInPage() {
    redirect('/auth/login');
}
