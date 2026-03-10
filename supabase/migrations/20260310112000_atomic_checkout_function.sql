-- Atomic task checkout function
-- Prevents multiple agents from working on the same task simultaneously

CREATE OR REPLACE FUNCTION checkout_analysis_task(
  p_company_id UUID,
  p_domain TEXT,
  p_agent_id UUID
)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  goal_id UUID,
  domain TEXT,
  title TEXT,
  description TEXT,
  priority INTEGER,
  status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atomic update and return
  RETURN QUERY
  UPDATE analysis_tasks
  SET 
    status = 'analyzing',
    locked_at = NOW(),
    locked_by_agent_id = p_agent_id,
    assigned_to_agent_id = p_agent_id,
    started_at = NOW()
  WHERE 
    analysis_tasks.company_id = p_company_id
    AND analysis_tasks.domain = p_domain
    AND analysis_tasks.status = 'queued'
    AND analysis_tasks.locked_at IS NULL
  ORDER BY 
    analysis_tasks.priority ASC,
    analysis_tasks.created_at ASC
  LIMIT 1
  RETURNING 
    analysis_tasks.id,
    analysis_tasks.company_id,
    analysis_tasks.goal_id,
    analysis_tasks.domain,
    analysis_tasks.title,
    analysis_tasks.description,
    analysis_tasks.priority,
    analysis_tasks.status;
END;
$$;

COMMENT ON FUNCTION checkout_analysis_task IS 'Atomically checkout next available task for a domain agent';

-- Grant execute permission to service role (edge functions)
GRANT EXECUTE ON FUNCTION checkout_analysis_task TO service_role;

-- Create index for efficient task lookup
CREATE INDEX IF NOT EXISTS idx_analysis_tasks_checkout 
ON analysis_tasks(company_id, domain, status, locked_at, priority)
WHERE status = 'queued' AND locked_at IS NULL;

-- Add timeout cleanup function (tasks locked > 30 minutes are freed)
CREATE OR REPLACE FUNCTION cleanup_stale_task_locks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE analysis_tasks
  SET 
    status = 'queued',
    locked_at = NULL,
    locked_by_agent_id = NULL,
    started_at = NULL
  WHERE 
    status = 'analyzing'
    AND locked_at < NOW() - INTERVAL '30 minutes'
    AND completed_at IS NULL;
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  -- Log cleanup
  IF cleaned_count > 0 THEN
    INSERT INTO transformation_log (
      company_id,
      actor_type,
      actor_name,
      action_type,
      message,
      metadata
    )
    SELECT DISTINCT
      company_id,
      'system',
      'Task Lock Cleanup',
      'task_lock_released',
      format('Released %s stale task locks', cleaned_count),
      jsonb_build_object('tasks_cleaned', cleaned_count)
    FROM analysis_tasks
    WHERE status = 'queued' 
    AND updated_at > NOW() - INTERVAL '1 minute';
  END IF;
  
  RETURN cleaned_count;
END;
$$;

-- Schedule periodic cleanup (would use pg_cron in production)
COMMENT ON FUNCTION cleanup_stale_task_locks IS 'Releases task locks older than 30 minutes. Run via pg_cron every 15 minutes.';