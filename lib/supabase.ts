import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oqhchpgahqtnmhnyvtzr.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaGNocGdhaHF0bm1obnl2dHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDUwNDMsImV4cCI6MjA5NTEyMTA0M30.d1OsFPRhi4YXe3ryzPmf3baGKYjMqy-j2JtEHo5FGbA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
