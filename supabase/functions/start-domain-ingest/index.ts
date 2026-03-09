// start-domain-ingest
// Triggers ingestion for a specific domain (Finance, Sales, Marketing, etc.)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Domain → Source mapping
const DOMAIN_SOURCES: Record<string, string[]> = {
  finance: ['xero', 'stripe', 'google_sheets'],
  sales: ['hubspot', 'pipedrive', 'salesforce'],
  marketing: ['google_analytics', 'google_ads', 'facebook', 'linkedin'],
  operations: ['slack', 'notion', 'asana', 'monday'],
  people: ['bamboohr', 'gusto', 'rippling', 'greenhouse'],
  product: ['github', 'jira', 'linear', 'mixpanel'],
  legal: ['google_drive', 'docusign'],
  strategy: ['google_drive', 'notion'],
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { company_id, domain } = await req.json()

    if (!company_id || !domain) {
      return new Response(
        JSON.stringify({ error: 'Missing company_id or domain' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Check which sources are connected for this domain
    const requiredSources = DOMAIN_SOURCES[domain] || []
    
    const { data: integrations } = await supabase
      .from('integrations')
      .select('toolkit, status')
      .eq('company_id', company_id)
      .in('toolkit', requiredSources)

    const connectedSources = integrations?.filter(i => 
      i.status === 'connected' || i.status === 'active'
    ) || []

    if (connectedSources.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No data sources connected',
          message: `${domain.toUpperCase()} agent needs: ${requiredSources.join(', ')}`,
          required_sources: requiredSources,
          connected_count: 0,
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Trigger ingestion for each connected source
    const results = []
    for (const integration of connectedSources) {
      try {
        // Trigger appropriate sync function
        const syncFunctionName = `sync-${integration.toolkit.replace('_', '-')}`
        
        console.log(`Triggering ${syncFunctionName} for company ${company_id}`)
        
        const { data: syncResult, error: syncError } = await supabase.functions.invoke(syncFunctionName, {
          body: { company_id }
        })

        results.push({
          source: integration.toolkit,
          status: syncError ? 'failed' : 'triggered',
          error: syncError?.message || null,
        })
      } catch (err) {
        console.error(`Failed to trigger ${integration.toolkit}:`, err)
        results.push({
          source: integration.toolkit,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    // Update domain score to show ingestion started
    const { error: scoreError } = await supabase
      .from('domain_scores')
      .upsert({
        company_id,
        domain,
        layer1_score: 0, // Will be updated by sync functions
        layer2_score: 0,
        total_score: 0,
        gaps: [`Ingesting from ${connectedSources.length} source(s)...`],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'company_id,domain' })

    if (scoreError) {
      console.error('Failed to update domain score:', scoreError)
    }

    return new Response(
      JSON.stringify({
        domain,
        triggered_sources: results,
        connected_count: connectedSources.length,
        required_sources: requiredSources,
        status: 'ingesting',
      }),
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})
