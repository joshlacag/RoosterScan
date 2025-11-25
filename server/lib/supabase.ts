import { createClient } from '@supabase/supabase-js'

// For development, use the values directly from .env
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gejsbfhgexnxrabksdhx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlanNiZmhnZXhueHJhYmtzZGh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDE5MjIsImV4cCI6MjA3MzA3NzkyMn0.jRf2eeG3fHrLRllL33-7GwaafSKixTo8O3Au_xUOATo'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL:', supabaseUrl)
  console.error('Supabase Key:', supabaseServiceKey ? 'Present' : 'Missing')
  throw new Error('Missing Supabase environment variables for server')
}

// Create Supabase client for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper function to get user ID from JWT token
export function getUserIdFromAuth(authHeader?: string): string {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }
  
  try {
    const token = authHeader.substring(7);
    
    // Decode JWT to get user ID (without verification for now)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    
    if (!payload.sub) {
      throw new Error('Invalid token: no user ID found');
    }
    
    return payload.sub;
  } catch (error) {
    console.error('Error decoding auth token:', error);
    throw new Error('Invalid authorization token');
  }
}
