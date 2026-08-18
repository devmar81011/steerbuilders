# Inquiry Email Notifications Setup

Get notified by email when someone submits the contact form on your website.

## Quick Setup (5 minutes)

### Step 1: Get Resend API Key

1. Sign up at **[resend.com](https://resend.com)** (free account)
2. Create an API key
3. Copy the key (starts with `re_...`)

### Step 2: Configure Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/stoocngdvtgvbbvdjmdo)
2. Navigate to **Project Settings** → **Edge Functions**
3. Click **Add secret** and add:
   ```
   RESEND_API_KEY = your_resend_api_key_here
   INQUIRY_NOTIFICATION_EMAIL = info@steerbuilderscorporation.com
   ```

### Step 3: Deploy Edge Function

Install Supabase CLI if you haven't:
```bash
npm install -g supabase
```

Deploy the function:
```bash
cd /path/to/steerbuilders
supabase link --project-ref stoocngdvtgvbbvdjmdo
supabase functions deploy notify-new-inquiry
```

### Step 4: Create Database Webhook

1. In Supabase Dashboard, go to **Database** → **Webhooks**
2. Click **Create a new hook**
3. Fill in:
   - **Name**: `notify-new-inquiry`
   - **Table**: `inquiries`
   - **Events**: ✅ INSERT (uncheck UPDATE and DELETE)
   - **Type**: Select `supabase_functions`
   - **Function**: `notify-new-inquiry`
4. Click **Create webhook**

### Step 5: Test

1. Go to your website: [steerbuilders.vercel.app](https://steerbuilders.vercel.app)
2. Scroll to the contact form
3. Submit a test inquiry
4. Check **info@steerbuilderscorporation.com** for the notification email
5. Also check spam folder just in case

## What You'll Receive

When someone submits an inquiry, you'll get a **professionally formatted email** with:
- ✅ Customer's name, email, and phone
- ✅ Project details/message
- ✅ Timestamp (Asia/Manila timezone)
- ✅ Direct link to view in admin dashboard
- ✅ SBC branding with gold accent colors

## Cost

**100% FREE** for typical inquiry volumes:
- Resend free tier: 100 emails/day
- Supabase Edge Functions: 500K invocations/month free

## Using Your Own Domain Email

For production, send from `inquiries@steerbuilderscorporation.com`:

1. In Resend dashboard, click **Domains** → **Add Domain**
2. Add `steerbuilderscorporation.com`
3. Add the DNS records Resend provides to your domain registrar
4. Wait for verification (usually < 1 hour)
5. Update the Edge Function code:
   ```typescript
   from: "Steer Builders <inquiries@steerbuilderscorporation.com>"
   ```
6. Redeploy: `supabase functions deploy notify-new-inquiry`

## Troubleshooting

### No email received?

1. **Check Edge Function logs**:
   - Supabase Dashboard → **Edge Functions** → `notify-new-inquiry` → **Logs**
   - Look for errors

2. **Verify secrets are set**:
   - Project Settings → Edge Functions → Check `RESEND_API_KEY` exists

3. **Check webhook is active**:
   - Database → Webhooks → `notify-new-inquiry` should show as enabled

4. **Test webhook manually**:
   - Click the webhook → **Send test payload**

5. **Check spam folder**

### "Email service not configured" error

Add `RESEND_API_KEY` in Project Settings → Edge Functions.

### Webhook not triggering

Make sure:
- ✅ Webhook is enabled
- ✅ Events = INSERT only
- ✅ Table = inquiries
- ✅ Type = supabase_functions
- ✅ Function = notify-new-inquiry

## Support

For detailed documentation, see:
- **[supabase/functions/notify-new-inquiry/README.md](./supabase/functions/notify-new-inquiry/README.md)**
- **[Resend Documentation](https://resend.com/docs)**
- **[Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)**
