'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Save, X, Maximize2, Minimize2, Loader2, Code, Eye } from 'lucide-react'

// Declare TinyMCE types
declare global {
  interface Window {
    tinymce: any
  }
}

interface WebsiteVisualEditorProps {
  pageTitle: string
  siteSubdomain: string
  initialContent: string
  onSave?: (content: string) => void
  onClose?: () => void
}

export default function WebsiteVisualEditor({ 
  pageTitle, 
  siteSubdomain, 
  initialContent, 
  onSave, 
  onClose 
}: WebsiteVisualEditorProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState(initialContent)
  const [showPreview, setShowPreview] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initializeEditor()
  }, [])

  const initializeEditor = async () => {
    try {
      setIsLoading(true)
      
      // Simple approach - just set up the contenteditable div
      setTimeout(() => {
        setIsLoading(false)
      }, 500) // Small delay to show loading state
    } catch (err) {
      console.error('Error initializing editor:', err)
      setError('Failed to load visual editor')
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      // Get content from the contenteditable div
      const editorElement = document.getElementById('visual-editor') as HTMLDivElement
      const editorContent = editorElement?.innerHTML || content
      
      // Extract just the website content (without the wrapper div)
      const parser = new DOMParser()
      const doc = parser.parseFromString(editorContent, 'text/html')
      const websiteContentDiv = doc.querySelector('.website-content')
      const bodyContent = websiteContentDiv?.innerHTML || editorContent
      
      // Get the original styles from the content
      const styleElements = doc.querySelectorAll('style, link[rel="stylesheet"]')
      let styleContent = ''
      styleElements.forEach(style => {
        styleContent += style.outerHTML
      })
      
      // Reconstruct the full HTML with styles
      const fullHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${pageTitle}</title>
          ${styleContent}
        </head>
        <body>
          ${bodyContent}
        </body>
        </html>
      `
      
      // Save the content
      const response = await fetch(`/api/public/sites/${siteSubdomain}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: pageTitle,
          content: fullHTML,
          isPublished: true,
          comment: 'Visual editor edit'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save page')
      }

      onSave?.(fullHTML)
      alert('Page saved successfully!')
    } catch (err) {
      console.error('Error saving page:', err)
      setError(err instanceof Error ? err.message : 'Failed to save page')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    setShowPreview(!showPreview)
  }

  const handleCodeView = () => {
    // Toggle between visual and code view
    const editorElement = document.getElementById('visual-editor') as HTMLDivElement
    if (editorElement) {
      if (editorElement.contentEditable === 'true') {
        editorElement.contentEditable = 'false'
        editorElement.style.fontFamily = 'monospace'
        editorElement.style.whiteSpace = 'pre'
      } else {
        editorElement.contentEditable = 'true'
        editorElement.style.fontFamily = 'inherit'
        editorElement.style.whiteSpace = 'normal'
      }
    }
  }

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
              onClick={() => window.location.reload()}
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
              onClick={handlePreview}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100"
              title="Preview"
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </button>
            <button
              onClick={handleCodeView}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100"
              title="Code View"
            >
              <Code className="w-4 h-4 mr-1" />
              Code
            </button>
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

        {/* Toolbar */}
        {!isLoading && !showPreview && (
          <div className="border-b border-gray-200 p-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => document.execCommand('bold')}
                className="px-3 py-1 text-sm font-bold border border-gray-300 rounded hover:bg-gray-100"
                title="Bold"
              >
                B
              </button>
              <button
                onClick={() => document.execCommand('italic')}
                className="px-3 py-1 text-sm italic border border-gray-300 rounded hover:bg-gray-100"
                title="Italic"
              >
                I
              </button>
              <button
                onClick={() => document.execCommand('underline')}
                className="px-3 py-1 text-sm underline border border-gray-300 rounded hover:bg-gray-100"
                title="Underline"
              >
                U
              </button>
              <div className="w-px h-6 bg-gray-300"></div>
              <button
                onClick={() => document.execCommand('insertUnorderedList')}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                title="Bullet List"
              >
                • List
              </button>
              <button
                onClick={() => document.execCommand('insertOrderedList')}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                title="Numbered List"
              >
                1. List
              </button>
              <div className="w-px h-6 bg-gray-300"></div>
              <button
                onClick={() => document.execCommand('justifyLeft')}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                title="Align Left"
              >
                ←
              </button>
              <button
                onClick={() => document.execCommand('justifyCenter')}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                title="Align Center"
              >
                ↔
              </button>
              <button
                onClick={() => document.execCommand('justifyRight')}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                title="Align Right"
              >
                →
              </button>
            </div>
          </div>
        )}

        {/* Editor Content */}
        <div className="flex-1 h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-gray-600">Loading Visual Editor...</p>
              </div>
            </div>
          ) : showPreview ? (
            <div className="h-full p-4">
              <div className="bg-gray-50 rounded-lg p-4 h-full overflow-auto">
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </div>
          ) : (
            <div className="h-full">
              <div
                id="visual-editor"
                contentEditable={true}
                className="w-full h-full border-0 outline-none focus:ring-2 focus:ring-blue-500"
                dangerouslySetInnerHTML={{ __html: content }}
                onInput={(e) => {
                  const target = e.target as HTMLDivElement
                  setContent(target.innerHTML)
                }}
                style={{
                  fontFamily: 'inherit',
                  lineHeight: 'inherit',
                  color: 'inherit'
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
