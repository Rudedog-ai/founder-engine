// sync-xero v1.0 | 12 March 2026
// Pulls key financial data from Xero via Composio OAuth token
// Stores extracted facts in knowledge_elements for Angus
// READ ONLY — never writes back to Xero (per CLAUDE.md rules)
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// ── Composio token extraction (same pattern as sync-google-drive) ──
async function getComposioToken(composioConnectionId: string): Promise<string> {
  const composioApiKey = Deno.env.get('COMPOSIO_API_KEY')
  if (!composioApiKey) throw new Error('COMPOSIO_API_KEY not configured')

  const res = await fetch(
    `https://backend.composio.dev/api/v3/connected_accounts/${composioConnectionId}`,
    { headers: { 'x-api-key': composioApiKey } }
  )
  if (!res.ok) throw new Error(`Composio API error: ${res.status}`)

  const account = await res.json()
  const token = account?.connectionParams?.access_token
    || account?.connectionParams?.accessToken
    || account?.authParams?.access_token
    || account?.auth_params?.access_token
  if (!token) throw new Error('No Xero access token in Composio account')

  // Xero also needs tenant ID
  const tenantId = account?.connectionParams?.tenantId
    || account?.connectionParams?.xero_tenant_id
    || account?.metadata?.tenantId

  return JSON.stringify({ token, tenantId })
}

// ── Xero API helpers ──
async function xeroGet(endpoint: string, token: string, tenantId: string) {
  const res = await fetch(`https://api.xero.com/api.xro/2.0/${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'xero-tenant-id': tenantId,
      'Accept': 'application/json',
    },
  })
  if (!res.ok) {
    const errText = await res.text()
    console.error(`Xero ${endpoint} error:`, res.status, errText)
    return null
  }
  return res.json()
}

// ── Fact extraction ──
interface Fact {
  domain: string
  fact_type: string
  entity: string
  value: string
  text: string
  confidence: number
  source: string
  source_name: string
}

function extractOrganisationFacts(org: Record<string, unknown>): Fact[] {
  const facts: Fact[] = []
  const add = (type: string, entity: string, value: string, text: string, conf = 0.95) =>
    facts.push({ domain: 'finance', fact_type: type, entity, value, text, confidence: conf, source: 'xero_api', source_name: 'Xero' })

  if (org.Name) add('organisation_name', 'company', String(org.Name), `Company registered in Xero as ${org.Name}`)
  if (org.LegalName) add('legal_name', 'company', String(org.LegalName), `Legal name: ${org.LegalName}`)
  if (org.BaseCurrency) add('base_currency', 'company', String(org.BaseCurrency), `Base currency: ${org.BaseCurrency}`)
  if (org.OrganisationType) add('entity_type', 'company', String(org.OrganisationType), `Entity type: ${org.OrganisationType}`)
  if (org.FinancialYearEndDay && org.FinancialYearEndMonth) {
    add('financial_year_end', 'company', `${org.FinancialYearEndDay}/${org.FinancialYearEndMonth}`, `Financial year ends ${org.FinancialYearEndDay}/${org.FinancialYearEndMonth}`)
  }
  if (org.TaxNumber) add('tax_number', 'company', String(org.TaxNumber), `Tax/VAT number: ${org.TaxNumber}`)
  return facts
}

function extractBankFacts(accounts: Array<Record<string, unknown>>): Fact[] {
  const facts: Fact[] = []
  for (const acc of accounts) {
    if (acc.Type === 'BANK' && acc.Name) {
      const name = String(acc.Name)
      if (acc.CurrencyCode) {
        facts.push({
          domain: 'finance', fact_type: 'bank_account', entity: name,
          value: `${acc.CurrencyCode}`, text: `Bank account: ${name} (${acc.CurrencyCode})`,
          confidence: 0.95, source: 'xero_api', source_name: 'Xero',
        })
      }
    }
  }
  return facts
}

function extractPnLFacts(reports: Record<string, unknown>): Fact[] {
  const facts: Fact[] = []
  const rows = (reports as any)?.Reports?.[0]?.Rows || []

  for (const section of rows) {
    if (section.RowType === 'Section' && section.Title && section.Rows) {
      const sectionTitle = String(section.Title).toLowerCase()
      for (const row of section.Rows) {
        if (row.RowType === 'Row' && row.Cells) {
          const label = row.Cells[0]?.Value
          const value = row.Cells[1]?.Value
          if (label && value && value !== '0.00' && value !== '') {
            const numVal = parseFloat(value.replace(/,/g, ''))
            if (!isNaN(numVal) && Math.abs(numVal) > 0) {
              facts.push({
                domain: 'finance',
                fact_type: sectionTitle.includes('income') || sectionTitle.includes('revenue') ? 'revenue_line' : 'expense_line',
                entity: label,
                value: value,
                text: `${label}: ${value} (from P&L)`,
                confidence: 0.9,
                source: 'xero_api',
                source_name: 'Xero P&L Report',
              })
            }
          }
        }
      }
      // Section summary row
      if (section.Rows?.length > 0) {
        const summaryRow = section.Rows.find((r: any) => r.RowType === 'SummaryRow')
        if (summaryRow?.Cells) {
          const label = summaryRow.Cells[0]?.Value
          const value = summaryRow.Cells[1]?.Value
          if (label && value) {
            facts.push({
              domain: 'finance', fact_type: 'pnl_summary', entity: label,
              value, text: `${label}: ${value}`,
              confidence: 0.95, source: 'xero_api', source_name: 'Xero P&L Report',
            })
          }
        }
      }
    }
  }
  return facts
}

function extractBalanceSheetFacts(reports: Record<string, unknown>): Fact[] {
  const facts: Fact[] = []
  const rows = (reports as any)?.Reports?.[0]?.Rows || []

  for (const section of rows) {
    if (section.RowType === 'Section' && section.Title && section.Rows) {
      const summaryRow = section.Rows.find((r: any) => r.RowType === 'SummaryRow')
      if (summaryRow?.Cells) {
        const label = summaryRow.Cells[0]?.Value || section.Title
        const value = summaryRow.Cells[1]?.Value
        if (label && value) {
          facts.push({
            domain: 'finance', fact_type: 'balance_sheet_summary', entity: label,
            value, text: `${label}: ${value} (Balance Sheet)`,
            confidence: 0.95, source: 'xero_api', source_name: 'Xero Balance Sheet',
          })
        }
      }
    }
  }
  return facts
}

function extractInvoiceFacts(invoices: Array<Record<string, unknown>>): Fact[] {
  const facts: Fact[] = []
  const outstanding = invoices.filter(i => i.Status === 'AUTHORISED' && i.Type === 'ACCREC')
  const overdue = outstanding.filter(i => {
    const due = new Date(String(i.DueDateString || i.DueDate))
    return due < new Date()
  })
  const totalOutstanding = outstanding.reduce((sum, i) => sum + (Number(i.AmountDue) || 0), 0)
  const totalOverdue = overdue.reduce((sum, i) => sum + (Number(i.AmountDue) || 0), 0)

  if (outstanding.length > 0) {
    facts.push({
      domain: 'finance', fact_type: 'accounts_receivable', entity: 'outstanding_invoices',
      value: totalOutstanding.toFixed(2),
      text: `${outstanding.length} outstanding invoices totalling ${totalOutstanding.toFixed(2)}`,
      confidence: 0.95, source: 'xero_api', source_name: 'Xero Invoices',
    })
  }
  if (overdue.length > 0) {
    facts.push({
      domain: 'finance', fact_type: 'overdue_receivables', entity: 'overdue_invoices',
      value: totalOverdue.toFixed(2),
      text: `${overdue.length} overdue invoices totalling ${totalOverdue.toFixed(2)}`,
      confidence: 0.95, source: 'xero_api', source_name: 'Xero Invoices',
    })
  }

  // Bills (payables)
  const bills = invoices.filter(i => i.Status === 'AUTHORISED' && i.Type === 'ACCPAY')
  const totalPayables = bills.reduce((sum, i) => sum + (Number(i.AmountDue) || 0), 0)
  if (bills.length > 0) {
    facts.push({
      domain: 'finance', fact_type: 'accounts_payable', entity: 'outstanding_bills',
      value: totalPayables.toFixed(2),
      text: `${bills.length} outstanding bills totalling ${totalPayables.toFixed(2)}`,
      confidence: 0.95, source: 'xero_api', source_name: 'Xero Bills',
    })
  }

  return facts
}

// ── Main handler ──
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { company_id } = await req.json()
    if (!company_id) throw new Error('Missing company_id')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Get Xero integration
    const { data: integration, error: intErr } = await supabase
      .from('integrations')
      .select('composio_connection_id, status')
      .eq('company_id', company_id)
      .eq('toolkit', 'xero')
      .single()

    if (intErr || !integration) {
      return new Response(JSON.stringify({ error: 'Xero not connected', skipped: true }), { headers: corsHeaders })
    }

    if (integration.status === 'expired') {
      return new Response(JSON.stringify({ error: 'Xero connection expired — reconnect needed', skipped: true }), { headers: corsHeaders })
    }

    // Get OAuth token
    const tokenData = JSON.parse(await getComposioToken(integration.composio_connection_id))
    const { token, tenantId } = tokenData

    if (!tenantId) {
      // Try to get tenant ID from Xero connections endpoint
      const connectionsRes = await fetch('https://api.xero.com/connections', {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      })
      if (connectionsRes.ok) {
        const connections = await connectionsRes.json()
        if (connections.length > 0) {
          const resolvedTenantId = connections[0].tenantId
          console.log('Resolved tenant ID from Xero connections:', resolvedTenantId)
          // Continue with resolved tenant ID
          return await pullXeroData(supabase, company_id, token, resolvedTenantId)
        }
      }
      throw new Error('Could not determine Xero tenant ID')
    }

    return await pullXeroData(supabase, company_id, token, tenantId)

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('sync-xero error:', msg)
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: corsHeaders }
    )
  }
})

async function pullXeroData(
  supabase: ReturnType<typeof createClient>,
  companyId: string,
  token: string,
  tenantId: string,
) {
  const allFacts: Fact[] = []
  const errors: string[] = []

  // 1. Organisation info
  const orgData = await xeroGet('Organisation', token, tenantId)
  if (orgData?.Organisations?.[0]) {
    allFacts.push(...extractOrganisationFacts(orgData.Organisations[0]))
  } else {
    errors.push('Failed to fetch organisation info')
  }

  // 2. Bank accounts
  const accountsData = await xeroGet('Accounts?where=Type%3D%3D%22BANK%22', token, tenantId)
  if (accountsData?.Accounts) {
    allFacts.push(...extractBankFacts(accountsData.Accounts))
  }

  // 3. Profit & Loss (last 12 months)
  const today = new Date()
  const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), 1)
  const fromDate = `${yearAgo.getFullYear()}-${String(yearAgo.getMonth() + 1).padStart(2, '0')}-01`
  const toDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const pnlData = await xeroGet(`Reports/ProfitAndLoss?fromDate=${fromDate}&toDate=${toDate}`, token, tenantId)
  if (pnlData) {
    allFacts.push(...extractPnLFacts(pnlData))
  } else {
    errors.push('Failed to fetch P&L report')
  }

  // 4. Balance Sheet
  const bsData = await xeroGet(`Reports/BalanceSheet?date=${toDate}`, token, tenantId)
  if (bsData) {
    allFacts.push(...extractBalanceSheetFacts(bsData))
  }

  // 5. Outstanding invoices & bills
  const invoicesData = await xeroGet(
    'Invoices?where=Status%3D%3D%22AUTHORISED%22&page=1',
    token, tenantId
  )
  if (invoicesData?.Invoices) {
    allFacts.push(...extractInvoiceFacts(invoicesData.Invoices))
  }

  // Clear old Xero facts for this company, then insert new ones
  await supabase
    .from('knowledge_elements')
    .delete()
    .eq('company_id', companyId)
    .eq('source', 'xero_api')

  if (allFacts.length > 0) {
    const rows = allFacts.map(f => ({
      company_id: companyId,
      domain: f.domain,
      fact_type: f.fact_type,
      entity: f.entity,
      value: f.value,
      text: f.text,
      confidence: f.confidence,
      source: f.source,
      source_name: f.source_name,
    }))

    const { error: insertErr } = await supabase.from('knowledge_elements').insert(rows)
    if (insertErr) {
      console.error('Failed to insert Xero facts:', insertErr)
      errors.push('Failed to store facts')
    }
  }

  // Trigger domain score recalculation
  try {
    await supabase.functions.invoke('calculate-domain-scores', {
      body: { company_id: companyId },
    })
  } catch (e) {
    console.error('Failed to trigger score recalc:', e)
  }

  return new Response(JSON.stringify({
    success: true,
    facts_extracted: allFacts.length,
    errors: errors.length > 0 ? errors : undefined,
  }), { headers: corsHeaders })
}
