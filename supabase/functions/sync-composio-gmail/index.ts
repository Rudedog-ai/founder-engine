// sync-composio-gmail v1.0.0 — Fetch Gmail emails via Composio and process forensically
// Batch approach: fetches up to 10 emails per invocation, returns page_token for continuation
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const COMPOSIO_BASE = 'https://backend.composio.dev/api/v3';

function jsonResp(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function composioAction(apiKey: string, actionName: string, connectedAccountId: string, input: Record<string, unknown>) {
  const res = await fetch(`${COMPOSIO_BASE}/actions/${actionName}/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      connected_account_id: connectedAccountId,
      input,
    }),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const COMPOSIO_API_KEY = Deno.env.get('COMPOSIO_API_KEY')!;
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const {
      company_id,
      page_token,
      batch_size = 10,
      query = '',
      after_date,
    } = await req.json();

    if (!company_id) return jsonResp({ error: 'company_id required' }, 400);

    // Get Composio connection ID for Gmail
    const { data: integration } = await supabase
      .from('integrations')
      .select('composio_connection_id')
      .eq('company_id', company_id)
      .eq('toolkit', 'gmail')
      .eq('status', 'connected')
      .single();

    if (!integration?.composio_connection_id) {
      return jsonResp({ error: 'Gmail not connected via Composio' }, 404);
    }

    const connId = integration.composio_connection_id;
    console.log(`Gmail sync for ${company_id}, connection: ${connId}`);

    // Build Gmail search query
    let searchQuery = query;
    if (!searchQuery && after_date) {
      searchQuery = `after:${after_date}`;
    }
    if (!searchQuery) {
      // Default: last 12 months
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const dateStr = oneYearAgo.toISOString().split('T')[0].replace(/-/g, '/');
      searchQuery = `after:${dateStr}`;
    }

    // Step 1: List emails from Gmail
    const listInput: Record<string, unknown> = {
      query: searchQuery,
      max_results: batch_size,
    };
    if (page_token) {
      listInput.page_token = page_token;
    }

    const listResult = await composioAction(
      COMPOSIO_API_KEY,
      'GMAIL_FETCH_EMAILS',
      connId,
      listInput
    );

    if (!listResult.ok) {
      console.error('Gmail list failed:', JSON.stringify(listResult.data));
      return jsonResp({
        error: 'Failed to list Gmail emails',
        detail: listResult.data,
      }, 500);
    }

    const responseData = listResult.data?.data?.response_data || listResult.data?.data || listResult.data;
    const messages = responseData?.messages || responseData?.emails || responseData?.items || [];
    const nextPageToken = responseData?.nextPageToken || responseData?.next_page_token || null;

    console.log(`Found ${messages.length} emails, nextPageToken: ${nextPageToken ? 'yes' : 'no'}`);

    // Step 2: Process each email
    const results: Array<{ subject: string; from: string; status: string; data_points?: number }> = [];
    let totalDataPoints = 0;

    for (const msg of messages) {
      const msgId = msg.id || msg.message_id;
      let subject = msg.subject || '';
      let from = msg.from || msg.sender || '';
      let bodyText = msg.body || msg.snippet || msg.text || '';

      // If we only have an ID, fetch the full message
      if (msgId && !bodyText) {
        try {
          const getResult = await composioAction(
            COMPOSIO_API_KEY,
            'GMAIL_GET_MESSAGE',
            connId,
            { message_id: msgId }
          );
          if (getResult.ok) {
            const msgData = getResult.data?.data?.response_data || getResult.data?.data || getResult.data;
            subject = msgData?.subject || subject;
            from = msgData?.from || msgData?.sender || from;
            bodyText = msgData?.body || msgData?.text || msgData?.snippet || '';
            // Extract headers if available
            if (msgData?.headers) {
              const headers = msgData.headers;
              if (Array.isArray(headers)) {
                for (const h of headers) {
                  if (h.name === 'Subject') subject = h.value;
                  if (h.name === 'From') from = h.value;
                }
              }
            }
          }
        } catch (e) {
          console.error(`Failed to fetch message ${msgId}:`, e);
        }
      }

      if (!bodyText || bodyText.length < 20) {
        results.push({ subject, from, status: 'no_content' });
        continue;
      }

      // Extract sender email
      const senderEmail = from.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || from;

      console.log(`Processing email: "${subject}" from ${senderEmail}`);

      try {
        // Feed into process-email (JSON mode)
        const processResp = await fetch(`${SUPABASE_URL}/functions/v1/process-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({
            company_id,
            sender_email: senderEmail,
            subject,
            body_text: bodyText.substring(0, 50000),
          }),
        });

        if (processResp.ok) {
          const processData = await processResp.json();
          const dp = processData.data_points || 0;
          totalDataPoints += dp;
          results.push({
            subject,
            from: senderEmail,
            status: processData.skipped ? 'noise' : 'processed',
            data_points: dp,
          });
          if (processData.skipped) {
            console.log(`  -> Classified as noise, skipped`);
          } else {
            console.log(`  -> ${dp} data points extracted`);
          }
        } else {
          const errText = await processResp.text();
          console.error(`  -> process-email failed: ${errText}`);
          results.push({ subject, from: senderEmail, status: 'process_error' });
        }
      } catch (e) {
        console.error(`  -> Error processing email "${subject}":`, e);
        results.push({ subject, from: senderEmail, status: 'error' });
      }
    }

    // Audit log
    await supabase.from('audit_log').insert({
      company_id,
      action: 'composio_gmail_sync',
      user_role: 'system',
      details: {
        query: searchQuery,
        emails_found: messages.length,
        emails_processed: results.filter(r => r.status === 'processed').length,
        noise_filtered: results.filter(r => r.status === 'noise').length,
        total_data_points: totalDataPoints,
        has_more: !!nextPageToken,
      },
    });

    return jsonResp({
      success: true,
      emails_found: messages.length,
      results,
      total_data_points: totalDataPoints,
      next_page_token: nextPageToken,
      has_more: !!nextPageToken,
    });

  } catch (error) {
    console.error('Gmail sync error:', error);
    return jsonResp({ error: error.message }, 500);
  }
});
