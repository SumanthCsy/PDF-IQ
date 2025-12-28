'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset email sent! Please check your inbox.');
    } catch (err: any) {
      console.error('Password reset error:', err);
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (err.code) {
        switch (err.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/missing-email':
            errorMessage = 'Please enter your email address.';
            break;
          default:
            errorMessage = err.message || errorMessage;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Forgot Password?
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="text-green-500 text-sm p-2 bg-green-50 rounded-md">
                {successMessage}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
          
          <div className="mt-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Mail className="h-3 w-3" />
            Check your spam folder if you don't see the email
          </div>
        </CardContent>
      </Card>
    </div>
  );
}