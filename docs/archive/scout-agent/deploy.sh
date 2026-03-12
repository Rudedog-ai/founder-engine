#!/bin/bash
# Scout Agent Deployment Script
# Run this to deploy everything to Supabase

set -e

PROJECT_REF="qzlicsovnldozbnmahsa"
FUNCTIONS_DIR="../supabase/functions"
MIGRATION_FILE="../supabase/migrations/20260309134700_scout_agent_tables.sql"

echo "🚀 Scout Agent Deployment"
echo "========================"
echo ""

# Check if logged in to Supabase
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Step 1: Deploy database schema
echo "📊 Step 1: Deploying database schema..."
echo "Run this SQL in Supabase Dashboard → SQL Editor:"
echo ""
cat $MIGRATION_FILE
echo ""
read -p "Press Enter after running the migration..."
echo "✅ Schema deployed"
echo ""

# Step 2: Link to project
echo "🔗 Step 2: Linking to Supabase project..."
supabase link --project-ref $PROJECT_REF || echo "Already linked"
echo ""

# Step 3: Deploy functions
echo "⚡ Step 3: Deploying edge functions..."
echo ""

cd ../supabase/functions

echo "Deploying scout-daily-run..."
supabase functions deploy scout-daily-run --no-verify-jwt

echo "Deploying scout-daily-nudge..."
supabase functions deploy scout-daily-nudge --no-verify-jwt

echo "Deploying scout-weekly-report..."
supabase functions deploy scout-weekly-report --no-verify-jwt

cd ../../scout-agent

echo "✅ All functions deployed"
echo ""

# Step 4: Configure secrets
echo "🔐 Step 4: Configure secrets in Supabase Dashboard"
echo ""
echo "Go to: https://supabase.com/dashboard/project/$PROJECT_REF/settings/vault"
echo ""
echo "Add these secrets:"
echo "  - ANTHROPIC_API_KEY = (your Anthropic key)"
echo "  - RESEND_API_KEY = re_DmrWW6mr_M5FtrTxSmxW1mFUAvJ58UdVy"
echo "  - SCOUT_EMAIL_TO = rfairbairns@gmail.com"
echo ""
read -p "Press Enter after adding secrets..."
echo "✅ Secrets configured"
echo ""

# Step 5: Set up cron jobs
echo "⏰ Step 5: Set up cron jobs"
echo ""
echo "Go to: https://supabase.com/dashboard/project/$PROJECT_REF/database/cron-jobs"
echo ""
echo "Add these 3 cron jobs:"
echo ""
echo "1. Daily Scraper (06:00 UTC):"
echo "   Schedule: 0 6 * * *"
echo "   Command:"
cat <<'EOF'
SELECT
  net.http_post(
    url:='https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-daily-run',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
EOF
echo ""
echo "2. Daily Nudge (09:00 UTC):"
echo "   Schedule: 0 9 * * *"
echo "   Command:"
cat <<'EOF'
SELECT
  net.http_post(
    url:='https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-daily-nudge',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
EOF
echo ""
echo "3. Weekly Report (Mondays 08:00 UTC):"
echo "   Schedule: 0 8 * * 1"
echo "   Command:"
cat <<'EOF'
SELECT
  net.http_post(
    url:='https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/scout-weekly-report',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
EOF
echo ""
echo "Replace YOUR_ANON_KEY with your anon key from Project Settings → API"
echo ""
read -p "Press Enter after adding cron jobs..."
echo "✅ Cron jobs configured"
echo ""

# Step 6: Test
echo "🧪 Step 6: Testing deployment..."
echo ""
echo "Get your anon key from: https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
echo ""
read -p "Enter your anon key: " ANON_KEY
echo ""

echo "Testing scout-daily-run..."
curl -X POST "https://$PROJECT_REF.supabase.co/functions/v1/scout-daily-run" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json"
echo ""
echo ""

echo "Testing scout-daily-nudge..."
curl -X POST "https://$PROJECT_REF.supabase.co/functions/v1/scout-daily-nudge" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json"
echo ""
echo ""

echo "✅ Deployment complete!"
echo ""
echo "📧 Check your email (rfairbairns@gmail.com) for test emails"
echo "📊 View discoveries: https://supabase.com/dashboard/project/$PROJECT_REF/editor"
echo "📝 View logs: https://supabase.com/dashboard/project/$PROJECT_REF/functions"
echo ""
echo "Next daily run: Tomorrow at 06:00 UTC"
echo "Next daily nudge: Tomorrow at 09:00 UTC (10am UK)"
echo "Next weekly report: Next Monday at 08:00 UTC (9am UK)"
