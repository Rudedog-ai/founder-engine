#!/bin/bash
# Quick test script for two-pass ingestion
# Usage: ./test-ingestion.sh

COMPANY_ID="4e0cce04-ed81-4e60-aa32-15aae72c6bf5"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bGljc292bmxkb3pibm1haHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTQwNjEsImV4cCI6MjA4ODIzMDA2MX0.vNIFau61Y5abqOi6m4KitFZNTym7f4Pj2X4emq4SWkM"

echo "🚀 Testing two-pass ingestion for OYNB..."
echo ""

curl -X POST "https://qzlicsovnldozbnmahsa.supabase.co/functions/v1/two-pass-ingest" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "'$COMPANY_ID'",
    "source": "google_drive",
    "date_filter": {
      "months": 24,
      "use_modified": true
    }
  }' | jq '.'

echo ""
echo "✅ Check results above"
echo "📊 View facts in dashboard: https://founder-engine-seven.vercel.app"
