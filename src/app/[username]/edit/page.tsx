'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Save, Eye, Code, Palette, Settings, Loader2, History, Upload, Shield, Database } from 'lucide-react'
import RevisionHistory from '@/components/editor/RevisionHistory'
import FileUpload from '@/components/editor/FileUpload'
import PageProtection from '@/components/editor/PageProtection'
import MediaWikiDashboard from '@/components/editor/MediaWikiDashboard'

interface EditPageProps {
  params: Promise<{
    username: string
  }>
}

export default function EditPage({ params }: EditPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [username, setUsername] = useState('')
  const [pageTitle, setPageTitle] = useState('Home')
  const [htmlContent, setHtmlContent] = useState('')
  const [cssContent, setCssContent] = useState('')
  const [jsContent, setJsContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js' | 'history' | 'files' | 'protection' | 'mediawiki'>('html')
  const [isOwner, setIsOwner] = useState(false)
  const [isCheckingOwner, setIsCheckingOwner] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [isProtected, setIsProtected] = useState(false)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [siteId, setSiteId] = useState('')
  const [pageId, setPageId] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [isMinorEdit, setIsMinorEdit] = useState(false)

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setUsername(resolvedParams.username)
      
      // Check if there's a page query parameter
      const pageParam = searchParams.get('page')
      if (pageParam) {
        setPageTitle(pageParam)
      }
    }
    loadParams()
  }, [params, searchParams])

  useEffect(() => {
    const checkPermissions = async () => {
      if (status === 'loading') return
      
      if (!session) {
        console.log(`[PERMISSIONS] No session found`)
        setIsOwner(false)
        setCanEdit(false)
        setIsCheckingOwner(false)
        return
      }
      
      console.log(`[PERMISSIONS] Session found:`, { userId: session.user?.id, name: session.user?.name })

      if (username) {
        try {
            // Check if the current user owns this site
            const response = await fetch(`/api/sites/by-subdomain/${username}`)
            if (response.ok) {
              const site = await response.json()
              const isOwnerCheck = session.user?.id === site.userId
              setIsOwner(isOwnerCheck)
              setSiteId(site.id)
              
              // Check page protection status
              const pageResponse = await fetch(`/api/sites/${site.id}/pages`)
              if (pageResponse.ok) {
                const pages = await pageResponse.json()
                const targetPage = pages.find((page: any) => page.title === pageTitle)
                
                console.log(`[PERMISSIONS] Site owner: ${isOwnerCheck}, Target page:`, targetPage)
                
                if (targetPage) {
                  setPageId(targetPage.id)
                  setIsProtected(targetPage.isProtected || false)
                  
                  // Use MediaWiki-style protection: owner can always edit, others need to be logged in for unprotected pages
                  const canEditCheck = isOwnerCheck || (!targetPage.isProtected && session?.user?.id)
                  console.log(`[PERMISSIONS] Page protected: ${targetPage.isProtected}, Can edit: ${canEditCheck}`)
                  console.log(`[PERMISSIONS] isOwnerCheck: ${isOwnerCheck}, isProtected: ${targetPage.isProtected}, hasSession: ${!!session?.user?.id}`)
                  setCanEdit(canEditCheck)
                  
                  // Load existing page content if can edit
                  if (canEditCheck) {
                    console.log(`[PERMISSIONS] Loading content for user who can edit`)
                    await loadExistingContent(site.id)
                  } else {
                    console.log(`[PERMISSIONS] Not loading content - user cannot edit`)
                  }
                } else {
                  // New page - can edit if logged in
                  const canEditNewPage = !!session.user?.id
                  console.log(`[PERMISSIONS] New page, can edit: ${canEditNewPage}`)
                  setCanEdit(canEditNewPage)
                }
              } else {
                // No pages found - can edit if logged in
                const canEditNewPage = !!session.user?.id
                console.log(`[PERMISSIONS] No pages API response, can edit: ${canEditNewPage}`)
                setCanEdit(canEditNewPage)
              }
            } else {
              setIsOwner(false)
              setCanEdit(false)
            }
        } catch (error) {
          console.error('Error checking permissions:', error)
          setIsOwner(false)
          setCanEdit(false)
        }
      }
      setIsCheckingOwner(false)
    }

    checkPermissions()
  }, [session, status, username, pageTitle])

  const loadExistingContent = async (siteId: string) => {
    setIsLoadingContent(true)
    console.log(`[LOAD CONTENT] Loading content for siteId: ${siteId}, pageTitle: ${pageTitle}`)
    try {
      // First try MediaWiki
      console.log(`[LOAD CONTENT] Trying MediaWiki first`)
      const mediawikiResponse = await fetch(`/api/sites/${siteId}/pages/${pageId}/mediawiki-revisions`)
      if (mediawikiResponse.ok) {
        const mediawikiData = await mediawikiResponse.json()
        if (mediawikiData.mediawikiHistory && mediawikiData.mediawikiHistory.length > 0) {
          const latestRevision = mediawikiData.mediawikiHistory[0]
          console.log(`[LOAD CONTENT] Found MediaWiki content`)
          
          // Parse MediaWiki content
          const parser = new DOMParser()
          const doc = parser.parseFromString(latestRevision.content, 'text/html')
          
          // Extract HTML content (body content)
          const bodyContent = doc.body.innerHTML
          setHtmlContent(bodyContent)
          
          // Extract CSS content
          const styleElement = doc.querySelector('style')
          if (styleElement) {
            setCssContent(styleElement.textContent || '')
          }
          
          // Extract JS content (combine all script tags)
          const scriptElements = doc.querySelectorAll('script')
          let jsContent = ''
          scriptElements.forEach(script => {
            if (script.textContent) {
              jsContent += script.textContent + '\n'
            }
          })
          const trimmedJs = jsContent.trim()
          console.log('Loading JS content from MediaWiki:', trimmedJs)
          setJsContent(trimmedJs)
          console.log(`[LOAD CONTENT] MediaWiki content loaded successfully`)
          return
        }
      }
      
      // Fallback to local database
      console.log(`[LOAD CONTENT] Falling back to local database`)
      const response = await fetch(`/api/sites/${siteId}/pages`)
      console.log(`[LOAD CONTENT] Pages API response: ${response.status}`)
      if (response.ok) {
        const pages = await response.json()
        console.log(`[LOAD CONTENT] Found ${pages.length} pages`)
        const targetPage = pages.find((page: any) => page.title === pageTitle)
        console.log(`[LOAD CONTENT] Target page found: ${!!targetPage}`)
        
        if (targetPage && targetPage.content) {
          console.log(`[LOAD CONTENT] Loading content from local page: ${targetPage.id}`)
          setPageId(targetPage.id)
          
          // Parse the existing HTML content
          const parser = new DOMParser()
          const doc = parser.parseFromString(targetPage.content, 'text/html')
          
          // Extract HTML content (body content)
          const bodyContent = doc.body.innerHTML
          setHtmlContent(bodyContent)
          
          // Extract CSS content
          const styleElement = doc.querySelector('style')
          if (styleElement) {
            setCssContent(styleElement.textContent || '')
          }
          
          // Extract JS content (combine all script tags)
          const scriptElements = doc.querySelectorAll('script')
          let jsContent = ''
          scriptElements.forEach(script => {
            if (script.textContent) {
              jsContent += script.textContent + '\n'
            }
          })
          const trimmedJs = jsContent.trim()
          console.log('Loading JS content from local:', trimmedJs)
          setJsContent(trimmedJs)
          console.log(`[LOAD CONTENT] Local content loaded successfully`)
        } else {
          console.log(`[LOAD CONTENT] No content found for page`)
        }
      } else {
        console.log(`[LOAD CONTENT] Pages API failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Error loading existing content:', error)
    } finally {
      setIsLoadingContent(false)
    }
  }

  const handleSave = async () => {
    if (!username) return
    
    setIsLoading(true)
    try {
      // Combine HTML, CSS, and JS into a single page
      console.log('Saving JS content:', jsContent) // Debug log
      const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${username}'s Website</title>
    <style>
        ${cssContent}
    </style>
</head>
<body>
    ${htmlContent}
    <script>
        ${jsContent}
    </script>
</body>
</html>`

      // First, try to get the site information
      const siteResponse = await fetch(`/api/sites/by-subdomain/${username}`)
      if (!siteResponse.ok) {
        const errorData = await siteResponse.json()
        throw new Error(errorData.error || 'Site not found. Please make sure you have created this site first.')
      }

      const response = await fetch(`/api/public/sites/${username}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: pageTitle,
          content: fullHtml,
          isPublished: true,
          comment: editSummary,
          isMinor: isMinorEdit
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save page')
      }

        // Redirect to the page
        if (pageTitle === 'Home') {
          router.push(`/${username}`)
        } else {
          router.push(`/${username}/${encodeURIComponent(pageTitle)}`)
        }
    } catch (error) {
      console.error('Error saving page:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMessage.includes('Site not found')) {
        alert(`❌ ${errorMessage}\n\nTo fix this:\n1. Go to /dashboard/sites/new\n2. Create a site with subdomain "${username}"\n3. Then come back to edit your page`)
      } else {
        alert(`❌ Failed to save page: ${errorMessage}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getPreviewContent = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <style>
        ${cssContent}
    </style>
</head>
<body>
    ${htmlContent}
    <script>
        ${jsContent}
    </script>
</body>
</html>`
  }

  if (isCheckingOwner) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Checking permissions...</span>
      </div>
    )
  }

  if (!canEdit) {
    console.log(`[ACCESS DENIED] canEdit: ${canEdit}, isProtected: ${isProtected}, isOwner: ${isOwner}`)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            {isProtected 
              ? "This page is protected and can only be edited by the owner."
              : "You need to be logged in to edit this page."
            }
          </p>
          <div className="text-sm text-gray-500 mb-4">
            Debug: canEdit={canEdit ? 'true' : 'false'}, isProtected={isProtected ? 'true' : 'false'}, isOwner={isOwner ? 'true' : 'false'}
          </div>
          <button
            onClick={() => router.push(`/${username}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Website
          </button>
        </div>
      </div>
    )
  }

  if (!username) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Edit {pageTitle} Page</h1>
              <p className="text-sm text-gray-600">{username}.localhost:3000/{pageTitle === 'Home' ? '' : pageTitle}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  previewMode 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Eye className="w-4 h-4 mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save & Publish'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Edit Summary Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Edit Summary</h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="editSummary" className="block text-sm font-medium text-gray-700 mb-1">
                Summary (optional)
              </label>
              <input
                type="text"
                id="editSummary"
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                placeholder="Briefly describe your changes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isMinorEdit"
                checked={isMinorEdit}
                onChange={(e) => setIsMinorEdit(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isMinorEdit" className="ml-2 block text-sm text-gray-700">
                This is a minor edit
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {previewMode ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Preview</h2>
            </div>
            <div className="p-6">
              <iframe
                srcDoc={getPreviewContent()}
                className="w-full h-96 border border-gray-200 rounded-md"
                title="Preview"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Code Editor */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6">
                    <button
                      onClick={() => setActiveTab('html')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'html'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Code className="w-4 h-4 inline mr-2" />
                      HTML
                    </button>
                    <button
                      onClick={() => setActiveTab('css')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'css'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Palette className="w-4 h-4 inline mr-2" />
                      CSS
                    </button>
                    <button
                      onClick={() => setActiveTab('js')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'js'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Settings className="w-4 h-4 inline mr-2" />
                      JavaScript
                    </button>
                    <button
                      onClick={() => setActiveTab('history')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'history'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <History className="w-4 h-4 inline mr-2" />
                      History
                    </button>
                    <button
                      onClick={() => setActiveTab('files')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'files'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Upload className="w-4 h-4 inline mr-2" />
                      Files
                    </button>
                    <button
                      onClick={() => setActiveTab('protection')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'protection'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Shield className="w-4 h-4 inline mr-2" />
                      Protection
                    </button>
                    <button
                      onClick={() => setActiveTab('mediawiki')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'mediawiki'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Database className="w-4 h-4 inline mr-2" />
                      MediaWiki
                    </button>
                  </nav>
                </div>

                {/* Editor */}
                <div className="p-6">
                  {isLoadingContent ? (
                    <div className="flex items-center justify-center h-96">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-gray-600">Loading existing content...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {activeTab === 'html' && (
                        <textarea
                          value={htmlContent}
                          onChange={(e) => setHtmlContent(e.target.value)}
                          placeholder="Enter your HTML content here..."
                          className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                      {activeTab === 'css' && (
                        <textarea
                          value={cssContent}
                          onChange={(e) => setCssContent(e.target.value)}
                          placeholder="Enter your CSS styles here..."
                          className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                      {activeTab === 'js' && (
                        <textarea
                          value={jsContent}
                          onChange={(e) => setJsContent(e.target.value)}
                          placeholder="Enter your JavaScript code here..."
                          className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                      {activeTab === 'history' && (
                        <RevisionHistory 
                          siteId={siteId} 
                          pageId={pageId} 
                          onRestore={(content) => {
                            const parser = new DOMParser()
                            const doc = parser.parseFromString(content, 'text/html')
                            setHtmlContent(doc.body.innerHTML)
                            const styleElement = doc.querySelector('style')
                            if (styleElement) {
                              setCssContent(styleElement.textContent || '')
                            }
                            const scriptElement = doc.querySelector('script')
                            if (scriptElement) {
                              setJsContent(scriptElement.textContent || '')
                            }
                          }}
                        />
                      )}
                      {activeTab === 'files' && (
                        <FileUpload 
                          siteId={siteId} 
                          pageId={pageId} 
                          onFileUploaded={(file) => {
                            console.log('File uploaded:', file)
                          }}
                        />
                      )}
                      {activeTab === 'protection' && (
                        <PageProtection 
                          siteId={siteId} 
                          pageId={pageId} 
                        />
                      )}
                      {activeTab === 'mediawiki' && (
                        <MediaWikiDashboard 
                          siteId={siteId} 
                          pageId={pageId} 
                          pageTitle={pageTitle}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Getting Started */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Getting Started</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>• Add HTML structure in the HTML tab</p>
                  <p>• Style your page with CSS</p>
                  <p>• Add interactivity with JavaScript</p>
                  <p>• Use Preview to see your changes</p>
                  <p>• Save & Publish when ready</p>
                </div>
              </div>

              {/* Quick Templates */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Start</h3>
                <button
                  onClick={() => {
                    setHtmlContent(`<div class="container">
  <h1>Welcome to My Website</h1>
  <p>This is a sample page. Edit me!</p>
  <button onclick="alert('Hello!')">Click me</button>
</div>`)
                    setCssContent(`body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
  color: #333;
  text-align: center;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #0056b3;
}`)
                    setJsContent(`// Add your JavaScript here
console.log('Welcome to your website!');`)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  Load Sample Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
