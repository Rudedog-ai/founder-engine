// IngestDashboard.tsx
// v1.0 | 9 March 2026
// Click-to-activate agents with real-time progress tracking

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface DomainProgress {
  domain: string;
  layer_1_score: number;
  layer_2_score: number;
  total_score: number;
  gaps: string[];
  status: 'idle' | 'processing' | 'complete';
  progress_percent: number;
}

const DOMAINS = [
  { key: 'finance', label: 'Finance Agent', icon: '💰', description: 'Revenue, expenses, cash flow' },
  { key: 'sales', label: 'Sales Agent', icon: '📊', description: 'Pipeline, deals, customers' },
  { key: 'marketing', label: 'Marketing Agent', icon: '📈', description: 'Traffic, campaigns, SEO' },
  { key: 'operations', label: 'Operations Agent', icon: '⚙️', description: 'Support, processes, fulfillment' },
  { key: 'people', label: 'People Agent', icon: '👥', description: 'Team, hiring, culture' },
  { key: 'product', label: 'Product Agent', icon: '🚀', description: 'Features, bugs, deployments' },
  { key: 'legal', label: 'Legal Agent', icon: '⚖️', description: 'Contracts, compliance, IP' },
  { key: 'strategy', label: 'Strategy Agent', icon: '🎯', description: 'Synthesized from all domains' },
];

export default function IngestDashboard() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [domainProgress, setDomainProgress] = useState<Record<string, DomainProgress>>({});
  const [processingQueue, setProcessingQueue] = useState<string[]>([]);

  useEffect(() => {
    loadCompanyAndProgress();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('ingest_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'domain_scores',
      }, handleDomainScoreUpdate)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ingest_log',
      }, handleIngestLogUpdate)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadCompanyAndProgress() {
    // Get company for current user
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user?.id)
      .single();

    if (!profile?.company_id) return;

    setCompanyId(profile.company_id);

    // Load domain scores
    const { data: scores } = await supabase
      .from('domain_scores')
      .select('*')
      .eq('company_id', profile.company_id);

    const progressMap: Record<string, DomainProgress> = {};
    
    DOMAINS.forEach(domain => {
      const score = scores?.find(s => s.domain === domain.key);
      progressMap[domain.key] = {
        domain: domain.key,
        layer_1_score: score?.layer_1_score || 0,
        layer_2_score: score?.layer_2_score || 0,
        total_score: score?.total_score || 0,
        gaps: score?.gaps || [],
        status: score?.total_score >= 25 ? 'complete' : 'idle',
        progress_percent: Math.round(((score?.total_score || 0) / 30) * 100),
      };
    });

    setDomainProgress(progressMap);
  }

  function handleDomainScoreUpdate(payload: any) {
    const score = payload.new;
    setDomainProgress(prev => ({
      ...prev,
      [score.domain]: {
        ...prev[score.domain],
        layer_1_score: score.layer_1_score,
        layer_2_score: score.layer_2_score,
        total_score: score.total_score,
        gaps: score.gaps,
        status: score.total_score >= 25 ? 'complete' : 'processing',
        progress_percent: Math.round((score.total_score / 30) * 100),
      }
    }));
  }

  function handleIngestLogUpdate(payload: any) {
    const log = payload.new;
    // Update processing status based on log events
    if (log.event_type === 'sync_started') {
      // Extract domain from source_type or details
    } else if (log.event_type === 'indexing') {
      // Show indexing progress
    }
  }

  async function activateAgent(domain: string) {
    if (!companyId) return;

    // Mark as processing
    setDomainProgress(prev => ({
      ...prev,
      [domain]: { ...prev[domain], status: 'processing' }
    }));

    setProcessingQueue(prev => [...prev, domain]);

    try {
      // Step 1: Classify unprocessed documents for this domain
      const { data: unprocessedDocs } = await supabase
        .from('raw_documents')
        .select('id')
        .eq('company_id', companyId)
        .is('domain', null)
        .limit(10);

      if (unprocessedDocs && unprocessedDocs.length > 0) {
        for (const doc of unprocessedDocs) {
          await supabase.functions.invoke('classify-document', {
            body: { company_id: companyId, document_id: doc.id }
          });
        }
      }

      // Step 2: Process domain-specific data
      if (domain === 'finance') {
        await supabase.functions.invoke('process-finance-data', {
          body: { company_id: companyId }
        });
      }
      // TODO: Add other domain processors when built

      // Step 3: Calculate scores
      await supabase.functions.invoke('calculate-domain-scores', {
        body: { company_id: companyId, domain }
      });

    } catch (error) {
      console.error('Agent activation error:', error);
      setDomainProgress(prev => ({
        ...prev,
        [domain]: { ...prev[domain], status: 'idle' }
      }));
    } finally {
      setProcessingQueue(prev => prev.filter(d => d !== domain));
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          INGEST Pipeline
        </h1>
        <p className="text-gray-600">
          Activate agents to build knowledge across 8 business domains.
          Target: Layer 2 depth (30%) before advisory begins.
        </p>
      </div>

      {/* Overall Progress */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Overall Progress</h2>
          <span className="text-sm text-gray-500">
            {Object.values(domainProgress).filter(d => d.total_score >= 25).length} / 8 domains complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ 
              width: `${Math.round(
                (Object.values(domainProgress).reduce((sum, d) => sum + d.total_score, 0) / (8 * 30)) * 100
              )}%` 
            }}
          />
        </div>
      </div>

      {/* Domain Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {DOMAINS.map(domain => {
          const progress = domainProgress[domain.key] || {
            layer_1_score: 0,
            layer_2_score: 0,
            total_score: 0,
            gaps: [],
            status: 'idle',
            progress_percent: 0,
          };

          const isProcessing = processingQueue.includes(domain.key);
          const isComplete = progress.total_score >= 25;

          return (
            <div 
              key={domain.key}
              className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
                isProcessing ? 'border-blue-500 shadow-lg' :
                isComplete ? 'border-green-500' :
                'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{domain.icon}</span>
                  {isComplete && <span className="text-green-500 text-xl">✓</span>}
                  {isProcessing && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{domain.label}</h3>
                <p className="text-xs text-gray-500">{domain.description}</p>
              </div>

              {/* Progress */}
              <div className="p-4">
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Layer 1</span>
                    <span className="font-medium">{progress.layer_1_score}/15</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.layer_1_score / 15) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Layer 2</span>
                    <span className="font-medium">{progress.layer_2_score}/15</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.layer_2_score / 15) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-gray-900">
                    {progress.total_score}
                    <span className="text-sm text-gray-500 font-normal">/30</span>
                  </span>
                  <span className="text-sm text-gray-600">
                    {progress.progress_percent}%
                  </span>
                </div>

                {/* Activate Button */}
                <button
                  onClick={() => activateAgent(domain.key)}
                  disabled={isProcessing || domain.key === 'strategy'}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                    isProcessing ? 'bg-blue-100 text-blue-600 cursor-not-allowed' :
                    isComplete ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                    domain.key === 'strategy' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                    'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isProcessing ? 'Processing...' :
                   isComplete ? 'Re-process' :
                   domain.key === 'strategy' ? 'Auto-synthesized' :
                   'Activate Agent'}
                </button>

                {/* Gaps */}
                {progress.gaps.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-700 mb-1">Gaps:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {progress.gaps.slice(0, 2).map((gap, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-yellow-500 mr-1">•</span>
                          <span className="flex-1">{gap}</span>
                        </li>
                      ))}
                      {progress.gaps.length > 2 && (
                        <li className="text-gray-500 italic">
                          +{progress.gaps.length - 2} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Processing Log */}
      {processingQueue.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-900 font-medium">
              Processing {processingQueue.length} agent{processingQueue.length > 1 ? 's' : ''}...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
