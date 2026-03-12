// FileBrowser.tsx - Show files being scanned during ingestion
// Helps user see exactly which files the agent is processing

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';

interface ScannedFile {
  id: string;
  filename: string;
  source: string;
  size: number;
  modified_date: string;
  relevance_score?: number;
  status: 'pending' | 'relevant' | 'skipped' | 'processed';
  facts_extracted?: number;
}

interface Props {
  companyId: string;
  sourceFilter?: string; // 'google_drive', 'gmail', etc.
}

export default function FileBrowser({ companyId, sourceFilter }: Props) {
  const [files, setFiles] = useState<ScannedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'relevant' | 'skipped'>('all');

  useEffect(() => {
    if (!companyId) return;

    // TODO: Create scanned_files table to track this
    // For now, mock data to show the UI concept
    const mockFiles: ScannedFile[] = [
      {
        id: '1',
        filename: 'Q4 2023 Financial Report.pdf',
        source: 'google_drive',
        size: 245000,
        modified_date: '2023-12-01',
        relevance_score: 0.95,
        status: 'processed',
        facts_extracted: 8,
      },
      {
        id: '2',
        filename: 'Board Meeting Notes 2024-01.docx',
        source: 'google_drive',
        size: 45000,
        modified_date: '2024-01-15',
        relevance_score: 0.88,
        status: 'processed',
        facts_extracted: 5,
      },
      {
        id: '3',
        filename: 'Random vacation photo.jpg',
        source: 'google_drive',
        size: 1200000,
        modified_date: '2015-06-20',
        relevance_score: 0.15,
        status: 'skipped',
        facts_extracted: 0,
      },
    ];

    setFiles(mockFiles);
    setLoading(false);
  }, [companyId, sourceFilter]);

  const filteredFiles = files.filter(f => {
    if (filter === 'relevant') return f.status === 'relevant' || f.status === 'processed';
    if (filter === 'skipped') return f.status === 'skipped';
    return true;
  });

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'processed': return 'var(--biolum)';
      case 'relevant': return 'var(--foam)';
      case 'skipped': return 'var(--text-muted)';
      default: return 'var(--text)';
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 12px' }} />
        Loading files...
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
      }}>
        <button
          className={filter === 'all' ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'}
          onClick={() => setFilter('all')}
          style={{ fontSize: '0.75rem' }}
        >
          All ({files.length})
        </button>
        <button
          className={filter === 'relevant' ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'}
          onClick={() => setFilter('relevant')}
          style={{ fontSize: '0.75rem' }}
        >
          Relevant ({files.filter(f => f.status === 'relevant' || f.status === 'processed').length})
        </button>
        <button
          className={filter === 'skipped' ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'}
          onClick={() => setFilter('skipped')}
          style={{ fontSize: '0.75rem' }}
        >
          Skipped ({files.filter(f => f.status === 'skipped').length})
        </button>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {filteredFiles.map(file => (
          <div key={file.id} style={{
            background: 'var(--surface)',
            padding: '12px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderLeft: `3px solid ${getStatusColor(file.status)}`,
          }}>
            {/* File icon */}
            <div style={{
              fontSize: '1.5rem',
              opacity: file.status === 'skipped' ? 0.4 : 1,
            }}>
              {file.filename.endsWith('.pdf') ? '📄' : 
               file.filename.endsWith('.docx') ? '📝' :
               file.filename.endsWith('.jpg') ? '🖼️' : '📁'}
            </div>

            {/* File info */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 500,
                color: 'var(--text)',
                marginBottom: '4px',
                opacity: file.status === 'skipped' ? 0.6 : 1,
              }}>
                {file.filename}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                display: 'flex',
                gap: '12px',
              }}>
                <span>{formatBytes(file.size)}</span>
                <span>{formatDate(file.modified_date)}</span>
                {file.relevance_score !== undefined && (
                  <span>
                    Relevance: {Math.round(file.relevance_score * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* Status badge */}
            <div style={{
              fontSize: '0.7rem',
              padding: '4px 8px',
              borderRadius: '4px',
              background: `${getStatusColor(file.status)}22`,
              color: getStatusColor(file.status),
              fontWeight: 600,
              textTransform: 'capitalize',
            }}>
              {file.status}
              {file.facts_extracted !== undefined && file.facts_extracted > 0 && (
                <span> ({file.facts_extracted} facts)</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--text-muted)',
          background: 'var(--surface)',
          borderRadius: '8px',
        }}>
          No files to show
        </div>
      )}
    </div>
  );
}
