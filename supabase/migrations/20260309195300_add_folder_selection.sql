-- Add Google Drive folder selection to companies table
-- This allows founders to choose which folder to scan (not entire Drive)

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS google_drive_folder_id TEXT,
ADD COLUMN IF NOT EXISTS google_drive_folder_name TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_folder_id 
ON companies(google_drive_folder_id) 
WHERE google_drive_folder_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN companies.google_drive_folder_id IS 'Google Drive folder ID to scan (instead of entire Drive). Founder-selected scope.';
COMMENT ON COLUMN companies.google_drive_folder_name IS 'Human-readable folder name for UI display';
