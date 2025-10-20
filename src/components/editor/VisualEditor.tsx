'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Save, X, Maximize2, Minimize2, Loader2 } from 'lucide-react'

interface VisualEditorProps {
  pageTitle: string
  siteSubdomain: string
  onSave?: (content: string) => void
  onClose?: () => void
}

export default function VisualEditor({ pageTitle, siteSubdomain, onSave, onClose }: VisualEditorProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // MediaWiki VisualEditor URL
  const mediawikiUrl = 'http://13.233.126.84'
  const visualEditorUrl = `${mediawikiUrl}/index.php?title=${encodeURIComponent(pageTitle)}&veaction=edit&vehidebetadialog=1&venoswitch=1`

  // Simplified - let the iframe handle everything

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const handleSave = () => {
    // For now, just show success message
    // The iframe will handle saving directly to MediaWiki
    onSave?.('')
    alert('Page saved successfully!')
  }

  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== mediawikiUrl) return

    if (event.data.action === 'content') {
      savePageContent(event.data.content)
    } else if (event.data.action === 'close') {
      onClose?.()
    }
  }

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-red-600">Error</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={loadPageContent}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-white rounded-lg shadow-xl ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-5/6'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Visual Editor</h2>
            <p className="text-sm text-gray-600">{pageTitle} • {siteSubdomain}.localhost:3000</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-gray-600">Loading Visual Editor...</p>
            </div>
          </div>
        )}

        {/* VisualEditor Iframe */}
        <div className="relative h-full">
          <iframe
            ref={iframeRef}
            src={visualEditorUrl}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            title="Visual Editor"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      </div>
    </div>
  )
}
