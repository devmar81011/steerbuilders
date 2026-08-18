# Inquiry Email Notifications

Contact form submissions are saved in Supabase and emailed to the office automatically. **No database webhook or Edge Function setup is required.**

## What happens

1. Someone submits the homepage contact form.
2. The inquiry is stored and listed at `/admin/inquiries`.
3. An email is sent to `info@steerbuilderscorporation.com` (or `INQUIRY_NOTIFICATION_EMAIL` if set).

The form still succeeds if email delivery fails.

## Default sending (already live)

If `RESEND_API_KEY` is not set, notifications go out through FormSubmit to the company inbox.

The **first** notification may be an activation email from FormSubmit. Open `info@steerbuilderscorporation.com`, click **Activate Form**, then later inquiries arrive normally. Check spam if you do not see it.

## Optional: branded sending with Resend

Use this if you want emails from your own domain instead of FormSubmit.

1. Create a free API key at [resend.com](https://resend.com)
2. Add these Vercel environment variables (Production):
   - `RESEND_API_KEY` = `re_...`
   - `INQUIRY_NOTIFICATION_EMAIL` = `info@steerbuilderscorporation.com`
   - `RESEND_FROM` = `Steer Builders <beth.t@example.com>` until your domain is verified in Resend
3. Redeploy

After your domain is verified in Resend, you can set:

```
RESEND_FROM=Steer Builders <inquiries@steerbuilderscorporation.com>
```
