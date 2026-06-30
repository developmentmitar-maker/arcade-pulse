import SignupForm from '@/components/auth/SignupForm';

export const metadata = {
  title: 'Create Account — Arcade Pulse',
  description: 'Sign up for Arcade Pulse to monitor Google Arcade for new games, bonus points, and announcements.',
};

export default function SignupPage() {
  return <SignupForm />;
}
