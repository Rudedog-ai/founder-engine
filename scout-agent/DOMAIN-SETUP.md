# Scout Agent Domain Setup

**Before Scout Agent can send emails, you need to verify founder-engine.co.uk with Resend**

---

## Step 1: Get a Resend Account (Separate from MiniMoguls)

1. Go to: https://resend.com/signup
2. Sign up with a different email OR create a separate workspace
3. Choose the **Free plan** (100 emails/day, plenty for Scout Agent)

---

## Step 2: Add Domain to Resend

1. In Resend dashboard → **Domains** → **Add Domain**
2. Enter: `founder-engine.co.uk`
3. Click **Add Domain**

---

## Step 3: Verify Domain (DNS Records)

Resend will show you 3 DNS records to add. Go to your DNS provider (wherever founder-engine.co.uk is hosted) and add:

### Record 1: SPF (TXT)
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

### Record 2: DKIM (TXT)
```
Type: TXT  
Name: resend._domainkey
Value: (Resend will show you the exact value - copy it exactly)
```

### Record 3: DMARC (TXT)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@founder-engine.co.uk
```

**Wait 5-30 minutes for DNS propagation**, then click **Verify** in Resend dashboard.

---

## Step 4: Get API Key

1. In Resend dashboard → **API Keys** → **Create API Key**
2. Name: `Scout Agent`
3. Permission: **Full Access**
4. Copy the API key (starts with `re_...`)

---

## Step 5: Add to Supabase

In Supabase Vault (Step 2 of deployment):

```
RESEND_API_KEY = re_... (paste your new key here)
```

---

## Alternative: Use Resend's Onboarding Domain (Temporary)

If you don't want to verify founder-engine.co.uk yet, you can use Resend's onboarding domain:

**Change the sender in both edge functions to:**
```typescript
from: 'Scout Agent <onboarding@resend.dev>',
```

**Limitations:**
- Emails may go to spam
- Not professional-looking
- Only works for testing

**Recommendation:** Verify founder-engine.co.uk properly for production use.

---

## Verification

After domain is verified, test email delivery:

```bash
curl -X POST https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-daily-nudge \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Check your inbox for an email from `scout@founder-engine.co.uk`.

---

## Troubleshooting

**Emails not sending?**
1. Check domain is verified in Resend dashboard (green checkmark)
2. Check DNS records are correct (use https://mxtoolbox.com/SuperTool.aspx)
3. Check Resend API key is correct in Supabase Vault
4. Check Resend logs for error messages

**Domain verification stuck?**
- DNS can take up to 24 hours to propagate globally
- Use https://dnschecker.org to check if records are visible worldwide
- Contact your DNS provider if records aren't appearing

---

**Next:** Once domain is verified, proceed with deployment (CLAUDE-DEPLOY-PROMPT.md)
