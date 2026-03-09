// run-scrapling
// Calls Python Scrapling script and returns results
// v1.0 | 9 March 2026

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { company_name, website } = await req.json()

    if (!company_name) {
      throw new Error('Missing company_name')
    }

    // Call Python Scrapling script
    const process = Deno.run({
      cmd: ["python3", "/home/agent/.openclaw/workspace/founder-engine/scripts/scrapling-test.py", company_name, website || ""],
      stdout: "piped",
      stderr: "piped",
    })

    const [status, stdout, stderr] = await Promise.all([
      process.status(),
      process.output(),
      process.stderrOutput(),
    ])

    process.close()

    if (!status.success) {
      const errorText = new TextDecoder().decode(stderr)
      throw new Error(`Scrapling failed: ${errorText}`)
    }

    const output = new TextDecoder().decode(stdout)
    const results = JSON.parse(output)

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Scrapling error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        note: "Scrapling requires Python environment - may not work in Supabase edge functions (Deno runtime)"
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
