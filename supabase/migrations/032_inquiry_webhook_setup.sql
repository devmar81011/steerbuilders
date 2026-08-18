-- Setup instructions for inquiry email notifications
-- This file documents the webhook configuration that must be done via Supabase Dashboard
-- (Database webhooks cannot be created via SQL migrations)

-- The webhook configuration should be:
-- Name: notify-new-inquiry
-- Table: inquiries
-- Events: INSERT only
-- Type: supabase_functions
-- Function: notify-new-inquiry

-- Manual setup steps:
-- 1. Deploy the Edge Function: supabase functions deploy notify-new-inquiry
-- 2. Set secrets in Supabase Dashboard (Project Settings → Edge Functions):
--    - RESEND_API_KEY (get from resend.com)
--    - INQUIRY_NOTIFICATION_EMAIL (default: info@steerbuilderscorporation.com)
-- 3. Create webhook in Database → Webhooks section
-- 4. Test by submitting a contact form inquiry

-- For detailed instructions, see: supabase/functions/notify-new-inquiry/README.md

-- This migration is documentation-only and can be safely run
SELECT 'Inquiry email notification webhook documented. See supabase/functions/notify-new-inquiry/README.md for setup instructions.' as setup_notes;
