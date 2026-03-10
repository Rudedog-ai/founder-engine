import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../Toast'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Package, 
  UserCheck, 
  Box, 
  Scale, 
  Target,
  Bot,
  CheckCircle,
  Clock,
  AlertCircle,
  Pause
} from 'lucide-react'

interface DomainAgent {
  id: string
  domain: string
  name: string
  title: string
  status: 'idle' | 'analyzing' | 'complete' | 'paused'
  spent_monthly_cents: number
  budget_monthly_cents: number
  last_run_at: string | null
  total_facts_extracted: number
  average_confidence_score: number | null
}

interface TransformationGoal {
  id: string
  title: string
  level: 'company' | 'domain' | 'action'
  status: 'planned' | 'in_progress' | 'complete' | 'skipped'
  owner_domain: string | null
  recommended_tool: string | null
  estimated_monthly_cost_cents: number | null
  estimated_annual_value_cents: number | null
}

export function OrchestrationView({ companyId }: { companyId: string }) {
  const [agents, setAgents] = useState<DomainAgent[]>([])
  const [goals, setGoals] = useState<TransformationGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [orchestrating, setOrchestrating] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    loadOrchestrationData()
  }, [companyId])

  async function loadOrchestrationData() {
    try {
      // Load domain agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('domain_agents')
        .select('*')
        .eq('company_id', companyId)
        .order('domain')

      if (agentsError) throw agentsError

      // Load transformation goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('transformation_goals')
        .select('*')
        .eq('company_id', companyId)
        .eq('level', 'action')
        .eq('status', 'planned')
        .order('estimated_annual_value_cents', { ascending: false })
        .limit(5)

      if (goalsError) throw goalsError

      setAgents(agentsData || [])
      setGoals(goalsData || [])
    } catch (error) {
      console.error('Error loading orchestration data:', error)
      showToast('Failed to load orchestration data', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function triggerOrchestration() {
    setOrchestrating(true)
    try {
      const { data, error } = await supabase.functions.invoke('angus-orchestrator', {
        body: { companyId, action: 'heartbeat' }
      })

      if (error) throw error

      showToast('Orchestration triggered successfully', 'success')
      
      // Reload data after a delay
      setTimeout(() => {
        loadOrchestrationData()
      }, 3000)
    } catch (error) {
      console.error('Orchestration error:', error)
      showToast('Failed to trigger orchestration', 'error')
    } finally {
      setOrchestrating(false)
    }
  }

  const getDomainIcon = (domain: string) => {
    const icons: Record<string, any> = {
      orchestrator: Bot,
      finance: DollarSign,
      sales: TrendingUp,
      marketing: Target,
      operations: Package,
      people: UserCheck,
      product: Box,
      legal: Scale,
      strategy: Target
    }
    return icons[domain] || Users
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return CheckCircle
      case 'analyzing': return Clock
      case 'paused': return Pause
      default: return AlertCircle
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'var(--biolum)'
      case 'analyzing': return 'var(--glow)'
      case 'paused': return 'var(--coral)'
      default: return 'var(--text-muted)'
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Loading orchestration view...</p>
      </div>
    )
  }

  // Find Angus (orchestrator)
  const angus = agents.find(a => a.domain === 'orchestrator')
  const domainAgents = agents.filter(a => a.domain !== 'orchestrator')

  return (
    <div className="orchestration-view">
      {/* Header */}
      <div className="orchestration-header">
        <div>
          <h2>AI Agent Orchestration</h2>
          <p>Paperclip-style multi-agent coordination</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={triggerOrchestration}
          disabled={orchestrating}
        >
          {orchestrating ? (
            <>
              <div className="spinner" style={{ width: '16px', height: '16px' }} />
              Orchestrating...
            </>
          ) : (
            'Run Analysis'
          )}
        </button>
      </div>

      {/* Angus Card (Orchestrator) */}
      {angus && (
        <div className="orchestrator-card">
          <div className="agent-icon orchestrator">
            <Bot size={32} />
          </div>
          <div className="agent-info">
            <h3>{angus.name}</h3>
            <p className="agent-title">{angus.title}</p>
            <div className="agent-stats">
              <span className="stat">
                Budget: £{(angus.budget_monthly_cents / 100).toFixed(0)}
              </span>
              <span className="stat">
                Spent: £{(angus.spent_monthly_cents / 100).toFixed(2)}
              </span>
              {angus.last_run_at && (
                <span className="stat">
                  Last run: {new Date(angus.last_run_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="agent-status">
            {React.createElement(getStatusIcon(angus.status), { 
              size: 20, 
              color: getStatusColor(angus.status) 
            })}
          </div>
        </div>
      )}

      {/* Domain Agents Grid */}
      <div className="agents-grid">
        {domainAgents.map(agent => {
          const Icon = getDomainIcon(agent.domain)
          const StatusIcon = getStatusIcon(agent.status)
          const budgetUsed = (agent.spent_monthly_cents / agent.budget_monthly_cents) * 100
          
          return (
            <div key={agent.id} className="agent-card">
              <div className="agent-header">
                <div className={`agent-icon ${agent.domain}`}>
                  <Icon size={20} />
                </div>
                <StatusIcon size={16} color={getStatusColor(agent.status)} />
              </div>
              
              <h4>{agent.name}</h4>
              <p className="agent-role">{agent.title}</p>
              
              <div className="agent-metrics">
                {agent.total_facts_extracted > 0 && (
                  <div className="metric">
                    <span className="metric-value">{agent.total_facts_extracted}</span>
                    <span className="metric-label">Facts</span>
                  </div>
                )}
                {agent.average_confidence_score && (
                  <div className="metric">
                    <span className="metric-value">
                      {(agent.average_confidence_score * 100).toFixed(0)}%
                    </span>
                    <span className="metric-label">Confidence</span>
                  </div>
                )}
              </div>
              
              <div className="agent-budget">
                <div className="budget-bar">
                  <div 
                    className="budget-fill"
                    style={{ 
                      width: `${Math.min(budgetUsed, 100)}%`,
                      backgroundColor: budgetUsed > 90 ? 'var(--coral)' : 'var(--glow)'
                    }}
                  />
                </div>
                <p className="budget-text">
                  £{(agent.spent_monthly_cents / 100).toFixed(2)} / 
                  £{(agent.budget_monthly_cents / 100).toFixed(0)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Top Recommendations */}
      {goals.length > 0 && (
        <div className="recommendations-section">
          <h3>Top Recommendations</h3>
          <div className="recommendations-list">
            {goals.map((goal, index) => (
              <div key={goal.id} className="recommendation-item">
                <div className="recommendation-rank">#{index + 1}</div>
                <div className="recommendation-content">
                  <h4>{goal.title}</h4>
                  <div className="recommendation-meta">
                    {goal.owner_domain && (
                      <span className="badge badge-accent">{goal.owner_domain}</span>
                    )}
                    {goal.recommended_tool && (
                      <span className="badge badge-green">{goal.recommended_tool}</span>
                    )}
                    {goal.estimated_monthly_cost_cents && (
                      <span className="cost">
                        £{(goal.estimated_monthly_cost_cents / 100).toFixed(0)}/mo
                      </span>
                    )}
                    {goal.estimated_annual_value_cents && (
                      <span className="value">
                        +£{(goal.estimated_annual_value_cents / 100).toLocaleString()}/yr
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .orchestration-view {
          padding: var(--gap);
        }

        .orchestration-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: calc(var(--gap) * 2);
        }

        .orchestration-header h2 {
          margin-bottom: 4px;
        }

        .orchestration-header p {
          color: var(--text-dim);
          font-size: 0.9rem;
        }

        /* Angus Card */
        .orchestrator-card {
          background: linear-gradient(135deg, var(--abyss) 0%, var(--ocean) 100%);
          border: 2px solid var(--wave);
          border-radius: var(--radius);
          padding: calc(var(--gap) * 1.5);
          display: flex;
          align-items: center;
          gap: var(--gap);
          margin-bottom: calc(var(--gap) * 2);
          position: relative;
          overflow: hidden;
        }

        .orchestrator-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(0, 240, 255, 0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        .agent-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
        }

        .agent-icon.orchestrator {
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(34, 209, 195, 0.2));
          border: 2px solid var(--glow);
        }

        .agent-info {
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .agent-info h3 {
          margin-bottom: 4px;
          font-size: 1.2rem;
        }

        .agent-title {
          color: var(--text-dim);
          margin-bottom: 8px;
        }

        .agent-stats {
          display: flex;
          gap: calc(var(--gap) * 1.5);
          font-size: 0.85rem;
        }

        .stat {
          color: var(--text-dim);
        }

        .agent-status {
          position: relative;
          z-index: 1;
        }

        /* Domain Agents Grid */
        .agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: var(--gap);
          margin-bottom: calc(var(--gap) * 2);
        }

        .agent-card {
          background: var(--abyss);
          border: 1px solid var(--sea);
          border-radius: var(--radius);
          padding: var(--gap);
          transition: all 0.2s ease;
        }

        .agent-card:hover {
          border-color: var(--wave);
          transform: translateY(-2px);
        }

        .agent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--gap);
        }

        .agent-icon.finance { background: rgba(255, 183, 77, 0.1); color: #FFB74D; }
        .agent-icon.sales { background: rgba(129, 199, 132, 0.1); color: #81C784; }
        .agent-icon.marketing { background: rgba(186, 104, 200, 0.1); color: #BA68C8; }
        .agent-icon.operations { background: rgba(77, 182, 172, 0.1); color: #4DB6AC; }
        .agent-icon.people { background: rgba(240, 98, 146, 0.1); color: #F06292; }
        .agent-icon.product { background: rgba(100, 181, 246, 0.1); color: #64B5F6; }
        .agent-icon.legal { background: rgba(255, 138, 101, 0.1); color: #FF8A65; }
        .agent-icon.strategy { background: rgba(149, 117, 205, 0.1); color: #9575CD; }

        .agent-icon:not(.orchestrator) {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .agent-card h4 {
          margin-bottom: 4px;
          font-size: 1rem;
        }

        .agent-role {
          color: var(--text-dim);
          font-size: 0.85rem;
          margin-bottom: var(--gap);
        }

        .agent-metrics {
          display: flex;
          gap: calc(var(--gap) * 1.5);
          margin-bottom: var(--gap);
        }

        .metric {
          text-align: center;
        }

        .metric-value {
          display: block;
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--glow);
        }

        .metric-label {
          display: block;
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 2px;
        }

        .agent-budget {
          margin-top: auto;
        }

        .budget-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 6px;
        }

        .budget-fill {
          height: 100%;
          transition: width 0.3s ease;
          border-radius: 2px;
        }

        .budget-text {
          font-size: 0.75rem;
          color: var(--text-dim);
          text-align: right;
        }

        /* Recommendations */
        .recommendations-section {
          background: linear-gradient(135deg, var(--abyss) 0%, var(--ocean) 100%);
          border: 1px solid var(--sea);
          border-radius: var(--radius);
          padding: calc(var(--gap) * 1.5);
        }

        .recommendations-section h3 {
          margin-bottom: var(--gap);
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: var(--gap);
        }

        .recommendation-item {
          display: flex;
          align-items: center;
          gap: var(--gap);
          padding: var(--gap);
          background: var(--deep);
          border-radius: var(--radius-sm);
          border: 1px solid var(--sea);
        }

        .recommendation-rank {
          font-size: 1.5rem;
          font-weight: 300;
          color: var(--wave);
          min-width: 40px;
        }

        .recommendation-content {
          flex: 1;
        }

        .recommendation-content h4 {
          margin-bottom: 8px;
          font-size: 0.95rem;
        }

        .recommendation-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .cost {
          color: var(--sand);
          font-size: 0.85rem;
        }

        .value {
          color: var(--biolum);
          font-size: 0.85rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}