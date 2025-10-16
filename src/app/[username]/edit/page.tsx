'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Save, Eye, Code, Palette, Settings } from 'lucide-react'

interface EditPageProps {
  params: Promise<{
    username: string
  }>
}

export default function EditPage({ params }: EditPageProps) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [cssContent, setCssContent] = useState('')
  const [jsContent, setJsContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html')
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setUsername(resolvedParams.username)
    }
    loadParams()
  }, [params])

  const handleSave = async () => {
    if (!username) return
    
    setIsLoading(true)
    try {
      // Combine HTML, CSS, and JS into a single page
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
          title: 'Home',
          content: fullHtml,
          isPublished: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save page')
      }

      // Redirect to the site
      router.push(`/${username}`)
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
              <h1 className="text-xl font-semibold text-gray-900">Edit Page</h1>
              <p className="text-sm text-gray-600">{username}.localhost:3000</p>
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
                  </nav>
                </div>

                {/* Editor */}
                <div className="p-6">
                  {activeTab === 'html' && (
                    <textarea
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      placeholder="Enter your HTML content here..."
                      className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                  {activeTab === 'css' && (
                    <textarea
                      value={cssContent}
                      onChange={(e) => setCssContent(e.target.value)}
                      placeholder="Enter your CSS styles here..."
                      className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                  {activeTab === 'js' && (
                    <textarea
                      value={jsContent}
                      onChange={(e) => setJsContent(e.target.value)}
                      placeholder="Enter your JavaScript code here..."
                      className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
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
