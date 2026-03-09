// ScraplingTest.tsx - With mock data fallback
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

// Mock data for testing when edge function isn't deployed yet
function getMockResults(companyName: string, website: string): ScraplingResult {
  return {
    company: companyName,
    website: website || '',
    timestamp: new Date().toISOString(),
    sources: {
      twitter: { found: true, count: 3 },
      linkedin: { found: true, count: 5 },
      google_news: { found: true, count: 8 },
      company_blog: { found: false, count: 0 }
    },
    total_mentions: 16,
    items: [
      {
        source: 'twitter',
        type: 'mention',
        title: 'Great work from ' + companyName,
        content: 'Excited to see what they build next! 🚀',
        url: 'https://twitter.com/example'
      },
      {
        source: 'linkedin',
        type: 'post',
        title: companyName + ' announces new partnership',
        content: 'We are thrilled to announce our partnership with leading industry players...',
        url: 'https://linkedin.com/example'
      },
      {
        source: 'google_news',
        type: 'article',
        title: companyName + ' raises $2M seed round',
        content: 'The startup announced today that it has raised $2M in seed funding...',
        url: 'https://techcrunch.com/example'
      }
    ]
  };
}

export default function ScraplingTest() {
  const [companyName, setCompanyName] = useState('OYNB');
  const [website, setWebsite] = useState('oynb.co.uk');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScraplingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usedMock, setUsedMock] = useState(false);

  async function runScraping() {
    setLoading(true);
    setError(null);
    setUsedMock(false);
    
    try {
      // Try real edge function first
      const { data, error: funcError } = await supabase.functions.invoke('run-scrapling', {
        body: { company_name: companyName, website: website }
      });

      if (funcError) {
        // Fallback to mock data
        console.log('Edge function not deployed, using mock data');
        setUsedMock(true);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
        setResults(getMockResults(companyName, website));
      } else {
        setResults(data);
      }
    } catch (err: any) {
      // Fallback to mock data
      console.log('Error calling edge function, using mock data:', err);
      setUsedMock(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setResults(getMockResults(companyName, website));
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
        
        {usedMock && (
          <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(0, 229, 200, 0.1)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--biolum)' }}>
            ℹ️ Using mock data (edge function not deployed yet)
          </div>
        )}
      </div>

      {error && (
        <div className="card" style={{ marginTop: '1rem', borderLeft: '3px solid var(--coral)', background: 'rgba(255, 107, 107, 0.05)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--coral)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Error</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>{error}</p>
        </div>
      )}

      {results && (
        <>
          <div style={{ 
            fontSize: '0.7rem', 
            fontWeight: 600, 
            letterSpacing: '1.5px', 
            color: 'var(--text-muted)',
            marginTop: '2rem',
            marginBottom: '1rem',
            textTransform: 'uppercase'
          }}>
            Results Summary
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--glow)', marginBottom: '4px' }}>
                {results.total_mentions}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Total Mentions
              </div>
            </div>
            
            {Object.entries(results.sources).map(([source, data]: [string, any]) => (
              <div key={source} className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: data.found ? 'var(--text)' : 'var(--text-muted)', marginBottom: '4px' }}>
                  {data.count || 0}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                  {source.replace('_', ' ')}
                </div>
                {data.found ? (
                  <span style={{ 
                    display: 'inline-block', 
                    padding: '2px 8px',
                    background: 'rgba(0, 229, 200, 0.1)',
                    border: '1px solid var(--biolum)',
                    borderRadius: '12px',
                    fontSize: '0.65rem', 
                    color: 'var(--biolum)',
                    fontWeight: 600
                  }}>
                    ✓ FOUND
                  </span>
                ) : (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    Not found
                  </span>
                )}
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Scraped at {new Date(results.timestamp).toLocaleString()}
          </div>

          {['twitter', 'linkedin', 'google_news', 'company_blog'].map(source => {
            const sourceItems = results.items.filter(item => item.source === source);
            if (sourceItems.length === 0) return null;

            const sourceConfig: Record<string, { emoji: string, label: string }> = {
              twitter: { emoji: '🐦', label: 'Twitter / X' },
              linkedin: { emoji: '💼', label: 'LinkedIn' },
              google_news: { emoji: '📰', label: 'Google News' },
              company_blog: { emoji: '📝', label: 'Company Blog' }
            };

            return (
              <div key={source} style={{ marginTop: '2rem' }}>
                <div style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 600, 
                  letterSpacing: '1.5px', 
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '1rem' }}>{sourceConfig[source].emoji}</span>
                  {sourceConfig[source].label}
                  <span style={{ marginLeft: 'auto', color: 'var(--glow)' }}>
                    {sourceItems.length} mention{sourceItems.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="card">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {sourceItems.map((item, idx) => (
                      <div key={idx} style={{ 
                        borderLeft: '2px solid var(--foam)',
                        paddingLeft: '14px',
                        paddingTop: '2px',
                        paddingBottom: '2px'
                      }}>
                        {item.title && (
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text)' }}>
                            {item.title}
                          </div>
                        )}
                        {item.content && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '8px', lineHeight: '1.5' }}>
                            {item.content}
                          </p>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                              fontSize: '0.75rem', 
                              color: 'var(--glow)', 
                              textDecoration: 'none',
                              fontWeight: 500
                            }}
                          >
                            View source →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </>
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
