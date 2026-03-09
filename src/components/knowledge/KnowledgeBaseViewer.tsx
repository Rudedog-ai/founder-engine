// KnowledgeBaseViewer.tsx - Browse extracted facts by domain
// NOT a chat interface - an ARCHIVE/INVENTORY of what the agent knows

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface KnowledgeFact {
  id: string;
  domain: string;
  fact_type: string;
  entity?: string;
  value?: number;
  text: string;
  confidence: number;
  source: string;
  source_name: string;
  document_date?: string;
  created_at: string;
}

const DOMAIN_CONFIG = [
  { key: 'finance', label: 'Finance', icon: '💰' },
  { key: 'sales', label: 'Sales', icon: '📊' },
  { key: 'marketing', label: 'Marketing', icon: '📈' },
  { key: 'operations', label: 'Operations', icon: '⚙️' },
  { key: 'people', label: 'People', icon: '👥' },
  { key: 'product', label: 'Product', icon: '🚀' },
  { key: 'legal', label: 'Legal', icon: '⚖️' },
  { key: 'strategy', label: 'Strategy', icon: '🎯' },
];

export default function KnowledgeBaseViewer() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>('finance');
  const [facts, setFacts] = useState<KnowledgeFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFact, setExpandedFact] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

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

    setLoading(true);
    
    supabase
      .from('knowledge_elements')
      .select('*')
      .eq('company_id', companyId)
      .eq('domain', selectedDomain)
      .order('confidence', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setFacts(data as KnowledgeFact[]);
        }
        setLoading(false);
      });
  }, [companyId, selectedDomain]);

  // Group facts by fact_type
  const groupedFacts = facts.reduce((acc, fact) => {
    const type = fact.fact_type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(fact);
    return acc;
  }, {} as Record<string, KnowledgeFact[]>);

  const totalFacts = facts.length;

  function getConfidenceColor(confidence: number) {
    if (confidence >= 0.9) return 'var(--biolum)'; // High confidence
    if (confidence >= 0.7) return 'var(--foam)'; // Medium confidence
    return 'var(--coral)'; // Low confidence
  }

  function formatDate(dateString?: string) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="intelligence-section">
      <div className="intelligence-section-title">Knowledge Base</div>
      
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Archive of facts extracted from your connected tools. Verify accuracy and explore sources.
      </div>

      {/* Domain tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}>
        {DOMAIN_CONFIG.map(domain => (
          <button
            key={domain.key}
            className={selectedDomain === domain.key ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'}
            onClick={() => setSelectedDomain(domain.key)}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            {domain.icon} {domain.label}
          </button>
        ))}
      </div>

      {/* Fact count */}
      <div style={{
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        marginBottom: '12px',
      }}>
        {totalFacts} fact{totalFacts !== 1 ? 's' : ''} in {selectedDomain}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          Loading knowledge base...
        </div>
      )}

      {/* Empty state */}
      {!loading && totalFacts === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--text-muted)',
          background: 'var(--surface)',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
          <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>No facts extracted yet</div>
          <div style={{ fontSize: '0.75rem' }}>
            Connect data sources and activate the {selectedDomain} agent to start learning.
          </div>
        </div>
      )}

      {/* Facts grouped by type */}
      {!loading && totalFacts > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(groupedFacts).map(([factType, factList]) => (
            <div key={factType} className="card" style={{
              background: 'var(--surface)',
              padding: '16px',
            }}>
              {/* Fact type header */}
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                marginBottom: '12px',
                color: 'var(--text)',
              }}>
                {factType.replace(/_/g, ' ')} ({factList.length})
              </div>

              {/* Facts in this type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {factList.map(fact => (
                  <div key={fact.id} style={{
                    background: 'var(--bg)',
                    padding: '12px',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${getConfidenceColor(fact.confidence)}`,
                  }}>
                    {/* Fact text */}
                    <div style={{
                      fontSize: '0.85rem',
                      color: 'var(--text)',
                      marginBottom: '6px',
                      fontWeight: 500,
                    }}>
                      {fact.text}
                    </div>

                    {/* Metadata row */}
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}>
                      {/* Confidence */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: getConfidenceColor(fact.confidence),
                        }} />
                        {Math.round(fact.confidence * 100)}% confidence
                      </div>

                      {/* Source */}
                      <div>
                        Source: {fact.source_name || fact.source}
                      </div>

                      {/* Date */}
                      {fact.document_date && (
                        <div>
                          {formatDate(fact.document_date)}
                        </div>
                      )}

                      {/* Expand button */}
                      <button
                        onClick={() => setExpandedFact(expandedFact === fact.id ? null : fact.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--foam)',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          marginLeft: 'auto',
                        }}
                      >
                        {expandedFact === fact.id ? 'Hide details' : 'Show details'}
                      </button>
                    </div>

                    {/* Expanded details */}
                    {expandedFact === fact.id && (
                      <div style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--ocean)',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                      }}>
                        <div style={{ marginBottom: '6px' }}>
                          <strong>Entity:</strong> {fact.entity || 'N/A'}
                        </div>
                        {fact.value !== null && fact.value !== undefined && (
                          <div style={{ marginBottom: '6px' }}>
                            <strong>Value:</strong> {fact.value.toLocaleString()}
                          </div>
                        )}
                        <div style={{ marginBottom: '6px' }}>
                          <strong>Source type:</strong> {fact.source}
                        </div>
                        <div style={{ marginBottom: '6px' }}>
                          <strong>Extracted:</strong> {formatDate(fact.created_at)}
                        </div>
                        <div style={{ marginBottom: '6px' }}>
                          <strong>Fact ID:</strong> {fact.id.slice(0, 8)}...
                        </div>
                        
                        {/* Verification buttons */}
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          marginTop: '12px',
                        }}>
                          <button
                            className="btn btn-small"
                            style={{
                              background: 'rgba(var(--biolum-rgb), 0.1)',
                              color: 'var(--biolum)',
                              border: '1px solid var(--biolum)',
                              fontSize: '0.7rem',
                              padding: '4px 8px',
                            }}
                            onClick={() => console.log('Verify correct:', fact.id)}
                          >
                            👍 Correct
                          </button>
                          <button
                            className="btn btn-small"
                            style={{
                              background: 'rgba(var(--coral-rgb), 0.1)',
                              color: 'var(--coral)',
                              border: '1px solid var(--coral)',
                              fontSize: '0.7rem',
                              padding: '4px 8px',
                            }}
                            onClick={() => console.log('Flag incorrect:', fact.id)}
                          >
                            👎 Incorrect
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
