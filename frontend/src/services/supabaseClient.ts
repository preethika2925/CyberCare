/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zshuteybuywijzbknhxb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzaHV0ZXlidXl3aWp6YmtuaHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1OTk4NDIsImV4cCI6MjEwMjE3NTg0Mn0.b7a3urSbZRlYBecf6DfpUyekz9w2Yn4XGzw-XaCNBY4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
