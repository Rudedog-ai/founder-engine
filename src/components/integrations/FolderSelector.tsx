// FolderSelector — Let founder choose Google Drive folder to scan
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

  // Load existing folder selection from database
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
      // Call edge function to list Google Drive folders
      const { data, error } = await supabase.functions.invoke('list-google-drive-folders', {
        body: { company_id: companyId }
      })

      if (error) throw error

      if (!data?.folders || data.folders.length === 0) {
        showToast('No folders found in Google Drive', 'error')
        setSelecting(false)
        return
      }

      // Show folder picker modal
      const folders = data.folders as Array<{ id: string; name: string }>
      
      // For now, just look for "Founder Engine Data" folder
      const targetFolder = folders.find(f => 
        f.name.toLowerCase().includes('founder engine') || 
        f.name.toLowerCase().includes('founderengine')
      )

      if (targetFolder) {
        await saveFolderId(targetFolder.id, targetFolder.name)
      } else {
        showToast('Create a folder called "Founder Engine Data" in Google Drive first', 'info')
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
      // Call edge function to create folder in Google Drive
      const { data, error } = await supabase.functions.invoke('create-google-drive-folder', {
        body: { 
          company_id: companyId,
          folder_name: 'Founder Engine Data'
        }
      })

      if (error) throw error

      if (data?.folder_id) {
        await saveFolderId(data.folder_id, 'Founder Engine Data')
        showToast('Folder created successfully!', 'success')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create folder', 'error')
    } finally {
      setLoading(false)
    }
  }

  const saveFolderId = async (id: string, name: string) => {
    // Save folder ID to companies table
    const { error } = await supabase
      .from('companies')
      .update({ 
        google_drive_folder_id: id,
        google_drive_folder_name: name
      })
      .eq('id', companyId)

    if (error) {
      showToast('Failed to save folder selection', 'error')
      return
    }

    setFolderId(id)
    setFolderName(name)
    showToast('Folder selected! We\'ll only scan files in this folder.', 'success')
    
    if (onFolderSelected) {
      onFolderSelected(id)
    }
  }

  if (folderId) {
    // Folder already selected
    return (
      <div className="bg-ocean-100/5 border border-ocean-300/20 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-ocean-400/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-ocean-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Selected Folder</h3>
            </div>
            <p className="text-ocean-200 text-sm mb-2">
              We'll only scan files in this folder:
            </p>
            <p className="text-white font-mono text-sm bg-ocean-900/50 rounded px-3 py-2 mb-3">
              {folderName}
            </p>
            <p className="text-ocean-300 text-xs">
              Folder ID: <span className="font-mono text-ocean-400">{folderId}</span>
            </p>
          </div>
          <button
            onClick={() => {
              setFolderId('')
              setFolderName('')
            }}
            className="text-ocean-400 hover:text-ocean-300 transition-colors text-sm"
          >
            Change
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-ocean-300/10">
          <p className="text-ocean-300 text-sm">
            💡 Add files to this folder anytime. We'll scan them automatically and update your knowledge base.
          </p>
        </div>
      </div>
    )
  }

  // No folder selected yet
  return (
    <div className="bg-ocean-100/5 border border-ocean-300/20 rounded-xl p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-lg bg-ocean-400/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-ocean-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">
            Choose Your Data Folder
          </h3>
          <p className="text-ocean-200 text-sm leading-relaxed">
            We'll only scan files you choose. Create a folder in Google Drive called{' '}
            <span className="font-mono text-ocean-300">"Founder Engine Data"</span> and copy your key documents there:
          </p>
        </div>
      </div>

      <div className="bg-ocean-900/30 rounded-lg p-4 mb-4">
        <ul className="space-y-2 text-sm text-ocean-200">
          <li className="flex items-start gap-2">
            <span className="text-ocean-400 mt-0.5">📊</span>
            <span>Last 12 months P&Ls, balance sheets, cash flow statements</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-400 mt-0.5">📈</span>
            <span>Board decks, strategy documents, annual plans</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-400 mt-0.5">📧</span>
            <span>Key email threads (saved as PDFs)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-400 mt-0.5">📝</span>
            <span>Meeting notes, retrospectives, post-mortems</span>
          </li>
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleCreateFolder}
          disabled={loading || selecting}
          className="flex-1 bg-ocean-500 hover:bg-ocean-400 disabled:bg-ocean-700 disabled:cursor-not-allowed
                     text-white rounded-lg px-4 py-3 text-sm font-medium transition-colors
                     flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Folder for Me
            </>
          )}
        </button>
        
        <button
          onClick={handleSelectFolder}
          disabled={loading || selecting}
          className="flex-1 bg-ocean-900/50 hover:bg-ocean-800/50 disabled:bg-ocean-900/30 disabled:cursor-not-allowed
                     text-ocean-200 hover:text-white border border-ocean-300/20
                     rounded-lg px-4 py-3 text-sm font-medium transition-colors
                     flex items-center justify-center gap-2"
        >
          {selecting ? (
            <>
              <div className="w-4 h-4 border-2 border-ocean-300/30 border-t-ocean-300 rounded-full animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              I Already Created It
            </>
          )}
        </button>
      </div>

      <div className="mt-4 flex items-start gap-2 text-xs text-ocean-400">
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>
          We'll only access files in the folder you choose. Your other Google Drive files remain private.
          Add files anytime to improve your knowledge base.
        </p>
      </div>
    </div>
  )
}
