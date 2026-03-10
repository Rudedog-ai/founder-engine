// IngestDashboard.tsx - Real-time two-pass ingestion progress
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../Toast';

interface DomainScore {
  domain: string;
  layer1_score: number;
  layer2_score: number;
  total_score: number;
  fact_count: number;
  gaps: string[];
}

interface IngestionProgress {
  source: string;
  total_files_before_date: number;
  total_files: number;
  scanned_files: number;
  relevant_files: number;
  facts_extracted: number;
  estimated_cost: number;
  date_filter_months: number;
  status: string;
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
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, DomainScore>>({});
  const [progress, setProgress] = useState<Record<string, IngestionProgress>>({});
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Get company ID
    supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCompanyId(data[0].id);
        }
      });
  }, [user]);

  useEffect(() => {
    if (!companyId) return;

    // Load domain scores
    supabase
      .from('domain_scores')
      .select('*')
      .eq('company_id', companyId)
      .then(({ data }) => {
        if (data) {
          const scoresMap: Record<string, DomainScore> = {};
          data.forEach((score: any) => {
            scoresMap[score.domain] = {
              domain: score.domain,
              layer1_score: score.layer1_score || 0,
              layer2_score: score.layer2_score || 0,
              total_score: score.total_score || 0,
              fact_count: score.fact_count || 0,
              gaps: score.gaps || [],
            };
          });
          setScores(scoresMap);
        }
        setLoading(false);
      });

    // Load ingestion progress
    supabase
      .from('ingestion_progress')
      .select('*')
      .eq('company_id', companyId)
      .then(({ data }) => {
        if (data) {
          const progressMap: Record<string, IngestionProgress> = {};
          data.forEach((p: any) => {
            progressMap[p.source] = {
              source: p.source,
              total_files_before_date: p.total_files_before_date || 0,
              total_files: p.total_files || 0,
              scanned_files: p.scanned_files || 0,
              relevant_files: p.relevant_files || 0,
              facts_extracted: p.facts_extracted || 0,
              estimated_cost: p.estimated_cost || 0,
              date_filter_months: p.date_filter_months || 24,
              status: p.status || 'pending',
            };
          });
          setProgress(progressMap);
        }
      });

    // Real-time listeners
    const scoresChannel = supabase
      .channel('domain-scores-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'domain_scores',
        filter: `company_id=eq.${companyId}`,
      }, (payload: any) => {
        if (payload.new) {
          setScores(prev => ({
            ...prev,
            [payload.new.domain]: {
              domain: payload.new.domain,
              layer1_score: payload.new.layer1_score || 0,
              layer2_score: payload.new.layer2_score || 0,
              total_score: payload.new.total_score || 0,
              fact_count: payload.new.fact_count || 0,
              gaps: payload.new.gaps || [],
            }
          }));
        }
      })
      .subscribe();

    const progressChannel = supabase
      .channel('ingestion-progress-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ingestion_progress',
        filter: `company_id=eq.${companyId}`,
      }, (payload: any) => {
        if (payload.new) {
          setProgress(prev => ({
            ...prev,
            [payload.new.source]: {
              source: payload.new.source,
              total_files_before_date: payload.new.total_files_before_date || 0,
              total_files: payload.new.total_files || 0,
              scanned_files: payload.new.scanned_files || 0,
              relevant_files: payload.new.relevant_files || 0,
              facts_extracted: payload.new.facts_extracted || 0,
              estimated_cost: payload.new.estimated_cost || 0,
              date_filter_months: payload.new.date_filter_months || 24,
              status: payload.new.status || 'pending',
            }
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(scoresChannel);
      supabase.removeChannel(progressChannel);
    };
  }, [companyId]);

  async function activateAgent(domainKey: string) {
    if (activating || !companyId) return;
    
    setActivating(domainKey);
    
    try {
      const { data, error } = await supabase.functions.invoke('two-pass-ingest', {
        body: { 
          company_id: companyId, 
          source: 'google_drive', // Start with Drive
        }
      });

      if (error) {
        console.error('Ingest error:', error);
        showToast(`Ingestion failed: ${error.message}`, 'error');
      } else {
        showToast(`${domainKey.toUpperCase()} agent activated! Processing files...`, 'success');
      }
    } catch (err) {
      console.error('Activation error:', err);
      showToast('Activation failed - check console', 'error');
    } finally {
      setActivating(null);
    }
  }

  if (loading) {
    return null;
  }

  // Calculate overall progress
  const totalFacts = Object.values(scores).reduce((sum, s) => sum + s.fact_count, 0);
  const avgScore = Object.values(scores).length > 0
    ? Object.values(scores).reduce((sum, s) => sum + s.total_score, 0) / Object.values(scores).length
    : 0;

  // Get active ingestion
  const activeIngestion = Object.values(progress).find(p => p.status === 'processing');

  return (
    <div className="intelligence-section">
      <div className="intelligence-section-title">INGEST Pipeline</div>
      
      {/* Overall stats */}
      <div style={{
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        marginBottom: '10px',
      }}>
        {totalFacts} facts extracted • {Math.round(avgScore)}% average knowledge
      </div>

      {/* Active ingestion progress */}
      {activeIngestion && (
        <div style={{
          background: 'rgba(var(--foam-rgb), 0.1)',
          border: '1px solid var(--foam)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '12px',
          fontSize: '0.75rem',
        }}>
          <div style={{ marginBottom: '6px', fontWeight: 600, color: 'var(--foam)' }}>
            Processing {activeIngestion.source}...
          </div>
          <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
            {activeIngestion.total_files_before_date > 0 && (
              <>
                Date filter: {activeIngestion.total_files_before_date} → {activeIngestion.total_files} files ({activeIngestion.total_files_before_date > 0 ? Math.round((1 - activeIngestion.total_files / activeIngestion.total_files_before_date) * 100) : 0}% skipped, last {activeIngestion.date_filter_months} months)
                <br />
              </>
            )}
            Scanned: {activeIngestion.scanned_files}/{activeIngestion.total_files} files •{' '}
            Relevant: {activeIngestion.relevant_files} ({activeIngestion.total_files > 0 ? Math.round((activeIngestion.relevant_files / activeIngestion.total_files) * 100) : 0}%) •{' '}
            Facts: {activeIngestion.facts_extracted} •{' '}
            Cost: ${activeIngestion.estimated_cost.toFixed(2)}
          </div>
          <div style={{
            height: '4px',
            background: 'var(--ocean)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              background: 'var(--foam)',
              width: `${activeIngestion.total_files > 0 ? (activeIngestion.scanned_files / activeIngestion.total_files) * 100 : 0}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {/* Domain cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '10px',
      }}>
        {DOMAIN_CONFIG.map(domain => {
          const score = scores[domain.key] || { 
            layer1_score: 0, 
            layer2_score: 0, 
            total_score: 0, 
            fact_count: 0,
            gaps: [] 
          };
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
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>
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
                    {score.fact_count} facts • {score.total_score}%
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
                  ) : isPartial ? `Continue (${score.fact_count} facts)` : 'Activate Agent'}
                </button>
              )}

              {/* Fact count */}
              {score.fact_count > 0 && !isComplete && (
                <div style={{
                  marginTop: '6px',
                  fontSize: '0.6rem',
                  color: 'var(--foam)',
                }}>
                  {score.fact_count} facts extracted
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
