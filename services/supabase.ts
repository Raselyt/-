
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://toqcawrphtcduhywlfik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcWNhd3JwaHRjZHVoeXdsZmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTgxMzAsImV4cCI6MjA4NTk5NDEzMH0.Mp99_gohLJPdwzXcKkcOtSthfRXjDM1JWm_NyBq4MhQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
