# Scout Agent Deployment Prompt for Claude

**Copy this entire prompt and paste into Claude.ai (or Claude API)**

---

You are deploying Scout Agent - an automated tool discovery system for Founder Engine.

## Your Mission

Deploy 3 edge functions and database schema to Supabase project `qzlicsovnldozbnmahsa`.

## Access Information

**GitHub repo:** https://github.com/Rudedog-ai/founder-engine

**Supabase project:** qzlicsovnldozbnmahsa (eu-west-1)

**Supabase dashboard:** https://supabase.com/dashboard/project/qzlicsovnldozbnmahsa

**Files you need (all in GitHub repo):**
- `supabase/migrations/20260309134700_scout_agent_tables.sql` - Database schema
- `supabase/functions/scout-daily-run/index.ts` - Daily scraper
- `supabase/functions/scout-daily-nudge/index.ts` - Daily email nudge
- `supabase/functions/scout-weekly-report/index.ts` - Weekly email report

## Step-by-Step Deployment

### Step 1: Deploy Database Schema

1. Fetch schema from GitHub:
   - `supabase/migrations/20260309134700_scout_agent_tables.sql`

2. Go to Supabase SQL Editor:
   - https://supabase.com/dashboard/project/qzlicsovnldozbnmahsa/sql/new

3. Copy the entire SQL file contents and paste

4. Click **Run**

5. Verify 4 tables created:
   - scout_discoveries
   - scout_evaluations
   - scout_manual_reviews
   - scout_digests

### Step 2: Configure Secrets

Go to: https://supabase.com/dashboard/project/qzlicsovnldozbnmahsa/settings/vault

Create 3 secrets:

**Secret 1:**
- Name: `ANTHROPIC_API_KEY`
- Value: (ask user for their Anthropic API key)

**Secret 2:**
- Name: `RESEND_API_KEY`
- Value: (ask user for Resend API key - needs separate account from MiniMoguls)

**Secret 3:**
- Name: `SCOUT_EMAIL_TO`
- Value: `rfairbairns@gmail.com`

### Step 3: Deploy Edge Functions

Go to: https://supabase.com/dashboard/project/qzlicsovnldozbnmahsa/functions

For each of the 3 functions:

**Function 1: scout-daily-run**
1. Click **Create Function**
2. Name: `scout-daily-run`
3. Fetch code from GitHub: `supabase/functions/scout-daily-run/index.ts`
4. Paste entire file contents
5. Click **Deploy**

**Function 2: scout-daily-nudge**
1. Click **Create Function**
2. Name: `scout-daily-nudge`
3. Fetch code from GitHub: `supabase/functions/scout-daily-nudge/index.ts`
4. Paste entire file contents
5. Click **Deploy**

**Function 3: scout-weekly-report**
1. Click **Create Function**
2. Name: `scout-weekly-report`
3. Fetch code from GitHub: `supabase/functions/scout-weekly-report/index.ts`
4. Paste entire file contents
5. Click **Deploy**

### Step 4: Set Up Cron Jobs

Go to: https://supabase.com/dashboard/project/qzlicsovnldozbnmahsa/database/cron-jobs

First, get the **anon key**:
- Go to: https://supabase.com/dashboard/project/qzlicsovnldozbnmahsa/settings/api
- Copy the `anon` `public` key

Create 3 cron jobs:

**Cron 1: Daily Scraper (6am UTC)**
- Name: `scout-daily-run`
- Schedule: `0 6 * * *`
- Command:
```sql
SELECT
  net.http_post(
    url:='https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-daily-run',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer [PASTE_ANON_KEY_HERE]"}'::jsonb
  ) AS request_id;
```

**Cron 2: Daily Nudge (9am UTC / 10am UK)**
- Name: `scout-daily-nudge`
- Schedule: `0 9 * * *`
- Command:
```sql
SELECT
  net.http_post(
    url:='https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-daily-nudge',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer [PASTE_ANON_KEY_HERE]"}'::jsonb
  ) AS request_id;
```

**Cron 3: Weekly Report (Mondays 8am UTC / 9am UK)**
- Name: `scout-weekly-report`
- Schedule: `0 8 * * 1`
- Command:
```sql
SELECT
  net.http_post(
    url:='https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-weekly-report',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer [PASTE_ANON_KEY_HERE]"}'::jsonb
  ) AS request_id;
```

### Step 5: Test Deployment

Ask user for their Supabase anon key, then run:

```bash
curl -X POST https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-daily-run \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: "application/json"
```

Expected response:
```json
{
  "success": true,
  "discoveries": 10-20,
  "evaluations": 3-6,
  "haiku_calls": 10-20,
  "opus_calls": 3-6,
  "cost_usd": 0.05-0.10
}
```

Then test daily nudge:
```bash
curl -X POST https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-daily-nudge \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json"
```

Check email (rfairbairns@gmail.com) for test email.

## What This System Does

**Daily (6am UTC):**
- Scrapes GitHub Trending, Product Hunt, Hacker News
- Finds 10-20 new AI/automation/business tools
- Haiku 4 filters 70% as noise
- Opus 4.6 evaluates remaining 30%
- Stores in Supabase

**Daily (10am UK):**
- Checks for HIGH PRIORITY tools (score ≥7.0)
- Sends email with clean cards showing:
  - Tool name + domain (Finance/Sales/Marketing/etc)
  - 4 scores: Relevance, Reputation, Safety, Maturity
  - Use case for Founder Engine
  - Why it matters
  - Review link

**Weekly (Mondays 9am UK):**
- Aggregates last 7 days
- Sends blog-style email with:
  - All high-priority tools
  - Watch list (promising but not ready)
  - Stats summary

**Cost:** ~$3/month (LLM only, email is free via Resend)

## Expected Outcomes

After deployment:
- Tomorrow 10am UK: First daily nudge email (if high-priority tools found)
- Next Monday 9am UK: First weekly report
- 10-20 high-quality tool discoveries per month
- Opus-vetted analysis on tools that matter

## Verification

After deployment, verify:
1. 4 tables exist in Database → Editor
2. 3 secrets exist in Settings → Vault
3. 3 functions exist in Functions (all deployed)
4. 3 cron jobs exist in Database → Cron Jobs
5. Test email received at rfairbairns@gmail.com

## Important Notes

- All edge functions use `--no-verify-jwt` (they're called by cron, not users)
- Secrets are accessed via `Deno.env.get('SECRET_NAME')`
- Cron jobs use net.http_post (PostgreSQL extension)
- Email sender: scout@minimoguls.co.uk
- Email recipient: rfairbairns@gmail.com (configurable via SCOUT_EMAIL_TO secret)

## If Something Fails

**Database schema error:**
- Check if tables already exist (run DROP TABLE IF EXISTS first)
- Verify RLS is enabled
- Check policies are created

**Function deployment error:**
- Verify secrets are configured (Step 2)
- Check function syntax (TypeScript)
- View logs in Functions → Logs

**Cron job error:**
- Verify anon key is correct (not service role key)
- Check URL is exact (https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/...)
- Verify schedule format (cron syntax)

**Email not received:**
- Check Resend dashboard for delivery logs
- Verify RESEND_API_KEY is correct
- Check spam folder
- Verify SCOUT_EMAIL_TO is correct

## Support

If you encounter issues:
1. Check Supabase Functions → Logs
2. Check Database → Cron Jobs → View runs
3. Check scout_discoveries table for data
4. Check scout_evaluations table for evaluations

---

**You have everything you need. Start with Step 1 (Database Schema).**
