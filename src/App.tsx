import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Dashboard } from './pages/Dashboard';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  return (
    <>
      <SignedOut>
        <LoginPage />
      </SignedOut>
      <SignedIn>
        <Dashboard />
      </SignedIn>
    </>
  );
}
