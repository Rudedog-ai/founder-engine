// IngestDashboard.tsx - MATCHES Founder Engine brand exactly
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

interface DomainScore {
  domain: string;
  layer1_score: number;
  layer2_score: number;
  total_score: number;
  gaps: string[];
}

const DOMAIN_CONFIG = [
  { key: 'finance', label: 'Revenue & Financials', icon: '💰', description: 'Revenue, expenses, cash flow' },
  { key: 'sales', label: 'Sales & Pipeline', icon: '📊', description: 'Pipeline, deals, customers' },
  { key: 'marketing', label: 'Marketing & Growth', icon: '📈', description: 'Traffic, campaigns, SEO' },
  { key: 'operations', label: 'Operations & Processes', icon: '⚙️', description: 'Workflows, systems, tools' },
  { key: 'people', label: 'Team & People', icon: '👥', description: 'Hiring, culture, org chart' },
  { key: 'product', label: 'Product & Tech', icon: '🚀', description: 'Roadmap, features, tech stack' },
  { key: 'legal', label: 'Legal & Compliance', icon: '⚖️', description: 'Contracts, IP, regulations' },
  { key: 'strategy', label: 'Strategy & Vision', icon: '🎯', description: 'Goals, market, competitive' },
];

export default function IngestDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [scores, setScores] = useState<Record<string, DomainScore>>({});
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  async function activateAgent(domainKey: string) {
    if (activating) return;
    
    setActivating(domainKey);
    
    try {
      // Get company ID from user
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user?.id)
        .limit(1);

      if (!companies || companies.length === 0) {
        showToast('Company not found', 'error');
        setActivating(null);
        return;
      }

      const companyId = companies[0].id;

      // Trigger domain-specific ingestion
      const { data, error } = await supabase.functions.invoke('start-domain-ingest', {
        body: { 
          company_id: companyId, 
          domain: domainKey 
        }
      });

      if (error) {
        console.error('Ingest error:', error);
        showToast(`${domainKey} agent activation failed: ${error.message}`, 'error');
      } else {
        showToast(`${domainKey.toUpperCase()} agent activated! Ingesting data...`, 'success');
        // Scores will update via real-time listener
      }
    } catch (err) {
      console.error('Activation error:', err);
      showToast('Activation failed - check console', 'error');
    } finally {
      setActivating(null);
    }
  }

  useEffect(() => {
    if (!user) return;
    
    // For now, show 0% scores (real data will come from Supabase)
    const mockScores: Record<string, DomainScore> = {};
    DOMAIN_CONFIG.forEach(domain => {
      mockScores[domain.key] = {
        domain: domain.key,
        layer1_score: 0,
        layer2_score: 0,
        total_score: 0,
        gaps: ['Platform access pending', 'Historical context needed']
      };
    });
    setScores(mockScores);
    setLoading(false);

    // Real-time listener
    const channel = supabase
      .channel('domain-scores-ingest')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'domain_scores',
      }, () => {
        // Reload scores when updated
        console.log('Domain scores updated');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return null; // Silent loading, or add a spinner
  }

  const completedCount = Object.values(scores).filter(s => s.total_score >= 30).length;

  return (
    <div className="intelligence-section">
      <div className="intelligence-section-title">INGEST Pipeline</div>
      <div style={{
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        marginBottom: '10px',
      }}>
        {completedCount} of {DOMAIN_CONFIG.length} domains complete
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '10px',
      }}>
        {DOMAIN_CONFIG.map(domain => {
          const score = scores[domain.key] || { layer1_score: 0, layer2_score: 0, total_score: 0, gaps: [] };
          const isComplete = score.total_score >= 30;
          const isPartial = score.total_score > 0 && score.total_score < 30;

          return (
            <div key={domain.key} className="card" style={{
              background: 'var(--surface)',
              padding: '14px',
              textAlign: 'center',
              opacity: isComplete ? 1 : 0.85,
              border: isComplete ? '1px solid var(--biolum)' : undefined,
            }}>
              <div style={{
                fontSize: '2rem',
                marginBottom: '8px',
              }}>
                {domain.icon}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '2px' }}>
                {domain.label}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {domain.description}
              </div>
              
              {/* Layer 1 + Layer 2 progress */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Layer 1</span>
                  <span>{score.layer1_score}/15</span>
                </div>
                <div style={{
                  height: '3px',
                  background: 'var(--ocean)',
                  borderRadius: '2px',
                  marginBottom: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    background: 'var(--foam)',
                    width: `${(score.layer1_score / 15) * 100}%`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>

                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Layer 2</span>
                  <span>{score.layer2_score}/15</span>
                </div>
                <div style={{
                  height: '3px',
                  background: 'var(--ocean)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    background: 'var(--glow)',
                    width: `${(score.layer2_score / 15) * 100}%`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>

              {/* Status */}
              {isComplete ? (
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--biolum)', fontWeight: 600 }}>
                    Complete ✓
                  </span>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {score.total_score}% knowledge
                  </div>
                </div>
              ) : (
                <button
                  className="btn btn-primary btn-small"
                  style={{ fontSize: '0.72rem', padding: '4px 12px' }}
                  disabled={activating === domain.key}
                  onClick={() => activateAgent(domain.key)}
                >
                  {activating === domain.key ? (
                    <>
                      <span className="spinner" style={{ width: 12, height: 12 }} />
                      {' '}Starting...
                    </>
                  ) : isPartial ? 'Continue' : 'Activate Agent'}
                </button>
              )}

              {/* Gaps (if any) */}
              {score.gaps.length > 0 && !isComplete && (
                <div style={{
                  marginTop: '6px',
                  fontSize: '0.6rem',
                  color: 'var(--coral)',
                  fontStyle: 'italic',
                }}>
                  {score.gaps.length} gap{score.gaps.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
