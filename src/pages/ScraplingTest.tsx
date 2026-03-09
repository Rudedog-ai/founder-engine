// ScraplingTest.tsx - Matches Founder Engine design exactly
import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface ScraplingResult {
  company: string;
  website: string;
  timestamp: string;
  sources: Record<string, any>;
  total_mentions: number;
  items: Array<{
    source: string;
    type: string;
    title?: string;
    content?: string;
    url: string;
  }>;
}

export default function ScraplingTest() {
  const [companyName, setCompanyName] = useState('OYNB');
  const [website, setWebsite] = useState('oynb.co.uk');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScraplingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runScraping() {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: funcError } = await supabase.functions.invoke('run-scrapling', {
        body: { company_name: companyName, website: website }
      });

      if (funcError) throw funcError;
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Scraping failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen-content">
      <div className="score-card">
        <div className="score-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00e5c8, #00f0ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              🔍
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                SCRAPLING TEST
              </div>
              <div className="score-label" style={{ textTransform: 'none' }}>
                Social Media & PR Intelligence
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ 
          fontSize: '0.7rem', 
          fontWeight: 600, 
          letterSpacing: '1.5px', 
          color: 'var(--text-muted)',
          marginBottom: '1rem',
          textTransform: 'uppercase'
        }}>
          Company Details
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '8px', fontWeight: 500 }}>
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="input-field"
              placeholder="OYNB"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '8px', fontWeight: 500 }}>
              Website (optional)
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="input-field"
              placeholder="oynb.co.uk"
            />
          </div>
        </div>

        <button onClick={runScraping} disabled={loading || !companyName} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
          {loading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />Scraping sources...</span> : 'Run Scraping Test'}
        </button>
      </div>

      {error && (
        <div className="card" style={{ marginTop: '1rem', borderLeft: '3px solid var(--coral)', background: 'rgba(255, 107, 107, 0.05)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--coral)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Error</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>{error}</p>
        </div>
      )}

      {!results && !loading && !error && (
        <div className="card" style={{ marginTop: '1.5rem', textAlign: 'center', padding: '4rem 1rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.3 }}>🔍</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Ready to scrape</div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
            Enter a company name and click "Run Scraping Test" to discover mentions across social media, news, and blogs
          </p>
        </div>
      )}
    </div>
  );
}
