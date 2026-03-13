// sync-composio-drive v4.0.0 — Fetch Google Drive files via Composio v3 and process forensically
// Uses GOOGLEDRIVE_DOWNLOAD_FILE with S3 URL fetch for content extraction
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

async function composioExecute(
  apiKey: string,
  toolSlug: string,
  connId: string,
  entityId: string,
  args: Record<string, unknown>
) {
  const res = await fetch(`${COMPOSIO_BASE}/tools/execute/${toolSlug}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      connected_account_id: connId,
      entity_id: entityId,
      arguments: args,
    }),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

function isGoogleWorkspace(mimeType: string): boolean {
  return mimeType.startsWith('application/vnd.google-apps.');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const COMPOSIO_API_KEY = Deno.env.get('COMPOSIO_API_KEY')!;
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { company_id, page_token, batch_size = 5, mode = 'full' } = await req.json();
    if (!company_id) return jsonResp({ error: 'company_id required' }, 400);

    const { data: integration } = await supabase
      .from('integrations')
      .select('composio_connection_id')
      .eq('company_id', company_id)
      .eq('toolkit', 'google_drive')
      .eq('status', 'connected')
      .single();

    if (!integration?.composio_connection_id) {
      return jsonResp({ error: 'Google Drive not connected via Composio' }, 404);
    }

    const connId = integration.composio_connection_id;
    const entityId = 'default';
    console.log(`Drive sync for ${company_id}, conn: ${connId}, mode: ${mode}`);

    // Step 1: List files
    const listArgs: Record<string, unknown> = {
      include_team_drives: false,
      page_size: batch_size,
    };
    if (page_token) listArgs.page_token = page_token;

    const listResult = await composioExecute(
      COMPOSIO_API_KEY, 'GOOGLEDRIVE_LIST_FILES', connId, entityId, listArgs
    );

    if (!listResult.ok) {
      return jsonResp({
        error: 'Failed to list Drive files',
        composio_status: listResult.status,
        detail: listResult.data,
      }, 500);
    }

    const rd = listResult.data?.data?.response_data || listResult.data?.data || listResult.data;
    const files = rd?.files || rd?.items || [];
    const nextPageToken = rd?.nextPageToken || rd?.next_page_token || null;

    console.log(`Found ${files.length} files, more: ${!!nextPageToken}`);

    if (mode === 'list') {
      return jsonResp({
        success: true,
        mode: 'list',
        files_found: files.length,
        files: files.map((f: Record<string, unknown>) => ({
          id: f.id, name: f.name || f.title,
          mimeType: f.mimeType || f.mime_type,
        })),
        next_page_token: nextPageToken,
        has_more: !!nextPageToken,
      });
    }

    // Step 2: Process each file
    const results: Array<{ file_name: string; status: string; data_points?: number; chars?: number }> = [];
    let totalDataPoints = 0;

    for (const file of files) {
      const fileName = file.name || file.title || 'unknown';
      const fileId = file.id;
      const mimeType = file.mimeType || file.mime_type || '';

      // Skip folders, shortcuts, media
      if (mimeType === 'application/vnd.google-apps.folder' ||
          mimeType === 'application/vnd.google-apps.shortcut' ||
          mimeType.startsWith('image/') ||
          mimeType.startsWith('video/') ||
          mimeType.startsWith('audio/')) {
        results.push({ file_name: fileName, status: 'skipped_type' });
        continue;
      }

      console.log(`Processing: ${fileName} (${mimeType})`);

      try {
        let content = '';

        // Download file — Google Workspace types need mime_type for export
        const dlArgs: Record<string, unknown> = { file_id: fileId };
        if (isGoogleWorkspace(mimeType)) {
          dlArgs.mime_type = 'text/plain';
        }

        const dlResult = await composioExecute(
          COMPOSIO_API_KEY, 'GOOGLEDRIVE_DOWNLOAD_FILE', connId, entityId, dlArgs
        );

        if (dlResult.ok && dlResult.data?.successful) {
          const dlData = dlResult.data?.data || {};
          const s3url = dlData?.downloaded_file_content?.s3url;

          if (s3url) {
            // Fetch actual content from S3
            try {
              const s3Resp = await fetch(s3url);
              if (s3Resp.ok) {
                content = await s3Resp.text();
              }
            } catch (e) {
              console.error(`  -> S3 fetch failed for ${fileName}:`, e);
            }
          } else {
            // Content might be inline
            content = dlData?.downloaded_file_content?.content ||
                      dlData?.content || dlData?.text || '';
          }
        } else {
          console.error(`  -> Download failed:`, JSON.stringify(dlResult.data?.error || dlResult.data?.data));
        }

        if (!content || content.length < 50) {
          results.push({ file_name: fileName, status: 'no_content' });
          continue;
        }

        // Feed into process-drive-document
        const processResp = await fetch(`${SUPABASE_URL}/functions/v1/process-drive-document`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({
            company_id,
            file_name: fileName,
            mime_type: mimeType,
            content: content.substring(0, 50000),
            source: `Google Drive: ${fileName}`,
          }),
        });

        if (processResp.ok) {
          const pd = await processResp.json();
          const dp = pd.data_points_extracted || pd.data_points || 0;
          totalDataPoints += dp;
          results.push({ file_name: fileName, status: 'processed', data_points: dp, chars: content.length });
          console.log(`  -> ${dp} data points from ${fileName} (${content.length} chars)`);
        } else {
          const errText = await processResp.text();
          console.error(`  -> process-drive-document failed: ${errText}`);
          results.push({ file_name: fileName, status: 'process_error' });
        }
      } catch (e) {
        console.error(`  -> Error processing ${fileName}:`, e);
        results.push({ file_name: fileName, status: 'error' });
      }
    }

    await supabase.from('audit_log').insert({
      company_id,
      action: 'composio_drive_sync',
      user_role: 'system',
      details: {
        files_found: files.length,
        files_processed: results.filter(r => r.status === 'processed').length,
        total_data_points: totalDataPoints,
        has_more: !!nextPageToken,
      },
    });

    return jsonResp({
      success: true,
      files_found: files.length,
      results,
      total_data_points: totalDataPoints,
      next_page_token: nextPageToken,
      has_more: !!nextPageToken,
    });

  } catch (error) {
    console.error('Sync error:', error);
    return jsonResp({ error: error.message }, 500);
  }
});
