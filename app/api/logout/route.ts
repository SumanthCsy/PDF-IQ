import { NextResponse } from 'next/server';
import { signOutUser } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    await signOutUser();
    return NextResponse.json({ message: 'Successfully logged out' });
  } catch (error) {
    console.error('[v0] Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}