const SUPABASE_URL = "https://jtkybsqseovnlbbppqxu.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0a3lic3FzZW92bmxiYnBwcXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzM2NjksImV4cCI6MjA5NzgwOTY2OX0.ggU7ynzcEDSvgweO6GK3VyMQd8o7whBPfJskR6BMso4";

var supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

window.supabaseClient = supabaseClient;
