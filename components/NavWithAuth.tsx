'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrainCircuit, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function NavWithAuth() {
  const { currentUser, loading, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 backdrop-blur-md sticky top-0 z-50 border-b border-border/40">
      <Link href="/" className="flex items-center gap-2">
        <img src="/logo.png" alt="PDF IQ Logo" className="h-8 w-8" />
        <span className="text-xl font-bold tracking-tight">PDF IQ</span>
      </Link>
      <div className="flex items-center gap-4">
        {loading ? (
          <div className="h-10 w-20 bg-muted rounded-md animate-pulse" />
        ) : currentUser ? (
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              disabled={isLoggingOut}
              className="flex items-center gap-2"
            >
              {isLoggingOut ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Logout
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}