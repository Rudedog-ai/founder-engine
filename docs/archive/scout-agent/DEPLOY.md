# Scout Agent Deployment Guide

**Complete setup for automated tool discovery with daily nudges + weekly reports**

---

## Prerequisites

- Supabase project: `qzlicsovnldozbnmahsa`
- Resend API key (for email delivery)
- Anthropic API key (for Haiku + Opus evaluations)
- Supabase CLI installed: `npm install -g supabase`

---

## Step 1: Deploy Database Schema

```bash
cd ~/.openclaw/workspace/founder-engine

# Push migration to Supabase
supabase db push --db-url "postgresql://postgres.qzlicsovnldozbnmahsa:YOUR_PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
```

Or run manually in Supabase Dashboard → SQL Editor:

```sql
-- Copy contents of supabase/migrations/20260309134700_scout_agent_tables.sql
```

**Verify tables created:**
- scout_discoveries
- scout_evaluations
- scout_manual_reviews
- scout_digests

---

## Step 2: Configure Secrets

In Supabase Dashboard → Project Settings → Vault:

```
ANTHROPIC_API_KEY = sk-ant-...
RESEND_API_KEY = re_...
SCOUT_EMAIL_TO = rfairbairns@gmail.com
PRODUCTHUNT_API_KEY = (optional, leave blank for now)
```

---

## Step 3: Deploy Edge Functions

```bash
cd ~/.openclaw/workspace/founder-engine

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref qzlicsovnldozbnmahsa

# Deploy all 3 functions
supabase functions deploy scout-daily-run
supabase functions deploy scout-daily-nudge
supabase functions deploy scout-weekly-report
```

**Verify deployment:**
```bash
supabase functions list
```

Should show:
- scout-daily-run
- scout-daily-nudge
- scout-weekly-report

---

## Step 4: Set Up Cron Jobs

In Supabase Dashboard → Database → Cron Jobs (pg_cron extension):

### Daily Scraper (06:00 UTC)

```sql
SELECT cron.schedule(
  'scout-daily-run',
  '0 6 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-daily-run',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) AS request_id;
  $$
);
```

### Daily Nudge (09:00 UTC = 10am UK)

```sql
SELECT cron.schedule(
  'scout-daily-nudge',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-daily-nudge',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) AS request_id;
  $$
);
```

### Weekly Report (Mondays 08:00 UTC = 9am UK)

```sql
SELECT cron.schedule(
  'scout-weekly-report',
  '0 8 * * 1',
  $$
  SELECT
    net.http_post(
      url:='https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-weekly-report',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) AS request_id;
  $$
);
```

**Replace YOUR_ANON_KEY** with your Supabase anon key from Project Settings → API

**Verify cron jobs:**
```sql
SELECT * FROM cron.job;
```

---

## Step 5: Test Manually

### Test Daily Scraper

```bash
curl -X POST https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-daily-run \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

**Expected response:**
```json
{
  "success": true,
  "discoveries": 15,
  "evaluations": 5,
  "haiku_calls": 15,
  "opus_calls": 5,
  "cost_usd": 0.079
}
```

### Test Daily Nudge

```bash
curl -X POST https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-daily-nudge \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

**Expected:** Email sent to rfairbairns@gmail.com with high-priority tools

### Test Weekly Report

```bash
curl -X POST https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-weekly-report \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

**Expected:** Blog-style email sent to rfairbairns@gmail.com

---

## Step 6: Verify Email Delivery

Check your inbox (rfairbairns@gmail.com):

**Daily Nudge:**
- Subject: "🔥 X High-Impact Tools Found — YYYY-MM-DD"
- Clean cards with scores, use cases, links
- Only sent when HIGH PRIORITY items exist

**Weekly Report:**
- Subject: "🔍 Scout Weekly Report: X High-Impact Tools • YYYY-MM-DD"
- Blog-style long-form email
- Full week's summary with stats

---

## Monitoring

### Check Cron Job History

```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### Check Scout Discoveries

```sql
SELECT 
  source,
  COUNT(*) as count,
  MAX(discovered_at) as last_discovery
FROM scout_discoveries
GROUP BY source;
```

### Check Evaluations by Recommendation

```sql
SELECT 
  recommendation,
  COUNT(*) as count,
  AVG(overall_score) as avg_score
FROM scout_evaluations
GROUP BY recommendation;
```

### Check Digest History

```sql
SELECT 
  digest_type,
  period_end::date as date,
  high_priority_count,
  watch_count,
  sent_to
FROM scout_digests
ORDER BY period_end DESC
LIMIT 10;
```

---

## Costs

**Daily (assuming 20 discoveries, 30% relevant):**
- Haiku filter: 20 × $0.0003 = $0.006
- Opus analysis: 6 × $0.015 = $0.09
- **Total: $0.096/day**

**Monthly: ~$2.88 USD**

**Email delivery (Resend):**
- Free tier: 3,000 emails/month
- Daily nudge: ~30 emails/month
- Weekly report: ~4 emails/month
- **Total: Free**

---

## Customization

### Change Email Recipient

Update secret in Supabase Vault:
```
SCOUT_EMAIL_TO = your-email@example.com
```

### Adjust Scraping Sources

Edit `scout-daily-run/index.ts`:
- Add/remove GitHub categories
- Enable Product Hunt scraper (requires API key)
- Add Reddit/Twitter scrapers

### Change Email Schedule

Update cron jobs:
- Daily nudge: Change `'0 9 * * *'` to desired time
- Weekly report: Change `'0 8 * * 1'` (Monday 8am) to desired day/time

### Customize Email Templates

Edit HTML in:
- `scout-daily-nudge/index.ts` (daily nudge template)
- `scout-weekly-report/index.ts` (weekly report template)

---

## Troubleshooting

### No emails received

1. Check Resend dashboard for delivery logs
2. Verify `RESEND_API_KEY` is set in Vault
3. Check spam folder
4. Test manually with curl command

### No discoveries found

1. Check GitHub API rate limits (60 req/hour unauthenticated)
2. Add `GITHUB_TOKEN` to Vault for 5,000 req/hour
3. Check function logs in Supabase Dashboard

### Cron jobs not running

1. Verify pg_cron extension is enabled
2. Check `cron.job_run_details` for errors
3. Verify Authorization header is correct (anon key, not service role)

---

## Next Steps

After deployment:

1. **Wait 24 hours** for first daily run
2. **Check email** for daily nudge next morning
3. **Wait until Monday** for first weekly report
4. **Review discoveries** in Supabase dashboard
5. **Add manual reviews** to train scoring:
   ```sql
   INSERT INTO scout_manual_reviews (discovery_id, decision, notes)
   VALUES ('uuid-here', 'approved', 'Great find!');
   ```

---

## Status

**Deployment checklist:**
- [ ] Database schema deployed
- [ ] Secrets configured
- [ ] Edge functions deployed
- [ ] Cron jobs scheduled
- [ ] Email delivery tested
- [ ] First daily run complete

---

**Questions? Check logs in Supabase Dashboard → Edge Functions → Logs**
