// FolderSelector v3 — Rewritten to use ocean.css (no Tailwind)
import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { useToast } from '../Toast'

interface Props {
  companyId: string
  onFolderSelected?: (folderId: string) => void
}

export default function FolderSelector({ companyId, onFolderSelected }: Props) {
  const { showToast } = useToast()
  const [folderId, setFolderId] = useState<string>('')
  const [folderName, setFolderName] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [selecting, setSelecting] = useState(false)

  useEffect(() => {
    supabase
      .from('companies')
      .select('google_drive_folder_id, google_drive_folder_name')
      .eq('id', companyId)
      .single()
      .then(({ data }) => {
        if (data?.google_drive_folder_id) {
          setFolderId(data.google_drive_folder_id)
          setFolderName(data.google_drive_folder_name || 'Founder Engine Data')
        }
      })
  }, [companyId])

  const handleSelectFolder = async () => {
    setSelecting(true)
    try {
      const { data, error } = await supabase.functions.invoke('list-google-drive-folders', {
        body: { company_id: companyId }
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      if (!data?.folders || data.folders.length === 0) {
        showToast('No folders found in Google Drive', 'error')
        setSelecting(false)
        return
      }
      const folders = data.folders as Array<{ id: string; name: string }>
      const targetFolder = folders.find(f =>
        f.name.toLowerCase().includes('founder engine') ||
        f.name.toLowerCase().includes('founderengine')
      )
      if (targetFolder) {
        await saveFolderId(targetFolder.id, targetFolder.name)
      } else {
        showToast('Create a folder called "Founder Engine Data" in Google Drive first', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load folders', 'error')
    } finally {
      setSelecting(false)
    }
  }

  const handleCreateFolder = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-google-drive-folder', {
        body: { company_id: companyId, folder_name: 'Founder Engine Data' }
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      if (data?.folder_id) {
        await saveFolderId(data.folder_id, 'Founder Engine Data')
        showToast('Folder created successfully!', 'success')
      } else {
        showToast('Unexpected response — no folder ID returned', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create folder', 'error')
    } finally {
      setLoading(false)
    }
  }

  const saveFolderId = async (id: string, name: string) => {
    const { error } = await supabase
      .from('companies')
      .update({ google_drive_folder_id: id, google_drive_folder_name: name })
      .eq('id', companyId)
    if (error) {
      showToast('Failed to save folder selection', 'error')
      return
    }
    setFolderId(id)
    setFolderName(name)
    showToast("Folder selected! We'll only scan files in this folder.", 'success')
    if (onFolderSelected) onFolderSelected(id)
  }

  if (folderId) {
    return (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>📁</span>
              <span style={{ fontWeight: 600 }}>Selected Folder</span>
            </div>
            <p style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
              We'll only scan files in this folder:
            </p>
            <div style={{
              fontFamily: 'monospace', fontSize: '0.85rem',
              background: 'var(--ocean)', borderRadius: 'var(--radius-sm)',
              padding: '8px 12px', marginBottom: '8px',
            }}>
              {folderName}
            </div>
          </div>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => { setFolderId(''); setFolderName('') }}
          >
            Change
          </button>
        </div>
        <div style={{
          marginTop: '12px', paddingTop: '12px',
          borderTop: '1px solid var(--sea)',
          fontSize: '0.8rem', color: 'var(--text-dim)',
        }}>
          Add files to this folder anytime. We'll scan them automatically.
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-sm)',
          background: 'rgba(0, 240, 255, 0.08)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          fontSize: '1.2rem',
        }}>
          📁
        </div>
        <div>
          <h3 style={{ marginBottom: '4px' }}>Choose Your Data Folder</h3>
          <p style={{ fontSize: '0.85rem' }}>
            We'll only scan files you choose. Create a folder in Google Drive called
            "Founder Engine Data" and copy your key documents there:
          </p>
        </div>
      </div>

      <div style={{
        background: 'var(--ocean)', borderRadius: 'var(--radius-sm)',
        padding: '14px', marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
          <div>📊 Last 12 months P&Ls, balance sheets, cash flow statements</div>
          <div>📈 Board decks, strategy documents, annual plans</div>
          <div>📧 Key email threads (saved as PDFs)</div>
          <div>📝 Meeting notes, retrospectives, post-mortems</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          className="btn btn-primary"
          style={{ flex: 1, fontSize: '0.85rem' }}
          disabled={loading || selecting}
          onClick={handleCreateFolder}
        >
          {loading ? 'Creating...' : 'Create Folder for Me'}
        </button>
        <button
          className="btn btn-secondary"
          style={{ flex: 1, fontSize: '0.85rem' }}
          disabled={loading || selecting}
          onClick={handleSelectFolder}
        >
          {selecting ? 'Loading...' : 'I Already Created It'}
        </button>
      </div>

      <p style={{
        marginTop: '12px', fontSize: '0.75rem',
        color: 'var(--text-muted)',
      }}>
        We'll only access files in the folder you choose. Your other Google Drive files remain private.
      </p>
    </div>
  )
}
