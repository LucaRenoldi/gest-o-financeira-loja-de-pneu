import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qoseugbrufxqkxtxvfzy.supabase.co'    // ← sua URL aqui
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvc2V1Z2JydWZ4cWt4dHh2Znp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzODA4NDksImV4cCI6MjA5MTk1Njg0OX0.CzxKlHbGPmpCkVOnnOBP7-MhVw6NFNX5uP5hTm9bxA4'                  // ← sua anon key aqui

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)