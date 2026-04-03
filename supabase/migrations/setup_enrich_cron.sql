-- Mode 3: Monthly scheduled enrichment sweep.
-- Requires pg_cron to be enabled:
--   Supabase Dashboard → Database → Extensions → pg_cron → Enable
-- Then run this SQL in the SQL Editor.

SELECT cron.schedule(
  'enrich-cards-monthly',
  '0 0 1 * *',
  $$
  SELECT net.http_post(
    url     := 'https://wvdwmywfxbvawulnoako.supabase.co/functions/v1/enrich-sweep',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2ZHdteXdmeGJ2YXd1bG5vYWtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODQ0NjEsImV4cCI6MjA4OTk2MDQ2MX0.LsrQaepnRUnPphXps7fVIM9mtD2N60Pd79pzusoPnHU"}'::jsonb,
    body    := '{"mode":"scheduled"}'::jsonb
  );
  $$
);
