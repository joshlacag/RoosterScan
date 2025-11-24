import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

// Get current user from Supabase session
export async function getUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Get current session
export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Sign in error:', error);
    throw new Error(error.message || 'Sign in failed');
  }
  return data;
}

// Sign up with email and password
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth`
    }
  });
  
  if (error) {
    console.error('Sign up error:', error);
    throw new Error(error.message || 'Sign up failed');
  }
  
  // Check if email confirmation is required
  if (data.user && !data.session) {
    throw new Error('Please check your email and click the confirmation link to complete registration.');
  }
  
  return data;
}

// Reset password - send reset email
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth?mode=reset`
  });
  
  if (error) {
    console.error('Password reset error:', error);
    throw new Error(error.message || 'Failed to send reset email');
  }
}

// Update password (after reset)
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (error) {
    console.error('Password update error:', error);
    throw new Error(error.message || 'Failed to update password');
  }
}

// Sign in with Google
export async function signInWithGoogle() {
  // Force redirect to production URL to avoid Vercel redirect issues
  const redirectUrl = import.meta.env.PROD 
    ? 'https://roosterscan-latest.onrender.com/auth'
    : `${window.location.origin}/auth`;
    
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl
    }
  });
  
  if (error) {
    console.error('Google sign in error:', error);
    throw new Error(error.message || 'Google sign in failed');
  }
  
  return data;
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Listen to auth state changes
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
