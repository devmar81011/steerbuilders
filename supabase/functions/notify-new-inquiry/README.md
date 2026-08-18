# Inquiry Email Notifications

This Edge Function sends email notifications when someone submits the contact form on the website.

## Setup Instructions

### 1. Get a Resend API Key

1. Sign up at [resend.com](https://resend.com) (free tier includes 100 emails/day)
2. Verify your domain or use their test domain `onboarding@resend.dev`
3. Go to **API Keys** and create a new key
4. Copy the API key (starts with `re_...`)

### 2. Add Resend API Key to Supabase

#### Option A: Supabase Dashboard (Recommended)

1. Go to your [Supabase project](https://supabase.com/dashboard/project/stoocngdvtgvbbvdjmdo)
2. Navigate to **Project Settings** → **Edge Functions**
3. Add these secrets:
   - `RESEND_API_KEY` → Your Resend API key
   - `INQUIRY_NOTIFICATION_EMAIL` → `info@steerbuilderscorporation.com` (or your preferred email)

#### Option B: Supabase CLI

```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
supabase secrets set INQUIRY_NOTIFICATION_EMAIL=info@steerbuilderscorporation.com
```

### 3. Deploy the Edge Function

```bash
supabase functions deploy notify-new-inquiry
```

### 4. Set Up Database Webhook

1. Go to **Database** → **Webhooks** in Supabase Dashboard
2. Click **Create a new hook**
3. Configure:
   - **Name**: `notify-new-inquiry`
   - **Table**: `inquiries`
   - **Events**: Check only `INSERT`
   - **Type**: `supabase_functions`
   - **Function**: `notify-new-inquiry`
4. Save the webhook

### 5. Test It

1. Submit a test inquiry via your contact form
2. Check your email (info@steerbuilderscorporation.com)
3. Check the Edge Function logs in Supabase Dashboard under **Edge Functions** → **notify-new-inquiry** → **Logs**

## Email Configuration

### Using Your Own Domain

For production, you should send emails from your own domain:

1. Add your domain in Resend dashboard
2. Add required DNS records (SPF, DKIM)
3. Update the `from` address in `index.ts`:
   ```typescript
   from: "Steer Builders <inquiries@steerbuilderscorporation.com>"
   ```
4. Redeploy the function

### Sending to Multiple Recipients

Edit `INQUIRY_NOTIFICATION_EMAIL` to include multiple emails:
```
info@steerbuilderscorporation.com,joseph@example.com
```

Or modify the code to use an array:
```typescript
to: ["info@steerbuilderscorporation.com", "joseph@example.com"]
```

## Troubleshooting

### No emails received

1. Check Edge Function logs for errors
2. Verify `RESEND_API_KEY` is set correctly
3. Check spam folder
4. Verify webhook is enabled and configured correctly

### "Email service not configured" error

The `RESEND_API_KEY` environment variable is missing. Add it in Project Settings → Edge Functions.

### Webhook not triggering

1. Check Database → Webhooks shows the webhook is enabled
2. Test the webhook manually from Supabase Dashboard
3. Check the webhook logs

## Cost

- **Resend Free Tier**: 100 emails/day, 3,000/month
- **Supabase Edge Functions**: 500K invocations/month free
- **Database Webhooks**: Included in Supabase free tier

For typical inquiry volumes, this solution is completely free.
