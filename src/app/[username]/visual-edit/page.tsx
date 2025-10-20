'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import WebsiteVisualEditor from '@/components/editor/WebsiteVisualEditor'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function MainSiteVisualEditPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [websiteContent, setWebsiteContent] = useState('')
  const [isLoadingContent, setIsLoadingContent] = useState(false)

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setUsername(Array.isArray(resolvedParams.username) ? resolvedParams.username[0] : resolvedParams.username)
      setIsLoading(false)
    }
    loadParams()
  }, [params])

  const loadWebsiteContent = async () => {
    try {
      setIsLoadingContent(true)
      
      // Get the site information
      const siteResponse = await fetch(`/api/sites/by-subdomain/${username}`)
      if (!siteResponse.ok) {
        throw new Error('Site not found')
      }
      const site = await siteResponse.json()

      // Get the Home page content
      const pagesResponse = await fetch(`/api/sites/${site.id}/pages`)
      if (pagesResponse.ok) {
        const pages = await pagesResponse.json()
        const homePage = pages.find((page: any) => page.title === 'Home')
        
        if (homePage && homePage.content) {
          // Load the complete HTML content with all styles
          const parser = new DOMParser()
          const doc = parser.parseFromString(homePage.content, 'text/html')
          
          // Extract styles from head
          const styles = doc.querySelectorAll('style, link[rel="stylesheet"]')
          let styleContent = ''
          styles.forEach(style => {
            if (style.tagName === 'STYLE') {
              styleContent += style.outerHTML
            } else if (style.tagName === 'LINK') {
              styleContent += style.outerHTML
            }
          })
          
          // Get body content
          const bodyContent = doc.body.innerHTML
          
          // Combine styles and body content
          const fullContent = `
            <div class="visual-editor-content">
              ${styleContent}
              <div class="website-content">
                ${bodyContent}
              </div>
            </div>
          `
          setWebsiteContent(fullContent)
        } else {
          // Default content if no page exists
          setWebsiteContent(`
            <div class="visual-editor-content">
              <style>
                .website-content {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  line-height: 1.6;
                  color: #333;
                }
                .website-content h1 {
                  font-size: 2.5rem;
                  font-weight: bold;
                  margin-bottom: 1rem;
                  color: #1f2937;
                }
                .website-content p {
                  font-size: 1.125rem;
                  margin-bottom: 1rem;
                }
              </style>
              <div class="website-content">
                <h1>Welcome to your website!</h1>
                <p>Start editing your content here.</p>
              </div>
            </div>
          `)
        }
      } else {
        // Default content if no pages found
        setWebsiteContent(`
          <div class="visual-editor-content">
            <style>
              .website-content {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .website-content h1 {
                font-size: 2.5rem;
                font-weight: bold;
                margin-bottom: 1rem;
                color: #1f2937;
              }
              .website-content p {
                font-size: 1.125rem;
                margin-bottom: 1rem;
              }
            </style>
            <div class="website-content">
              <h1>Welcome to your website!</h1>
              <p>Start editing your content here.</p>
            </div>
          </div>
        `)
      }
    } catch (error) {
      console.error('Error loading website content:', error)
      setWebsiteContent(`
        <div class="visual-editor-content">
          <style>
            .website-content {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .website-content h1 {
              font-size: 2.5rem;
              font-weight: bold;
              margin-bottom: 1rem;
              color: #1f2937;
            }
            .website-content p {
              font-size: 1.125rem;
              margin-bottom: 1rem;
            }
          </style>
          <div class="website-content">
            <h1>Welcome to your website!</h1>
            <p>Start editing your content here.</p>
          </div>
        </div>
      `)
    } finally {
      setIsLoadingContent(false)
    }
  }

  const handleSave = (content: string) => {
    console.log('Main site saved:', content)
    // Redirect back to the main site
    router.push(`/${username}`)
  }

  const handleClose = () => {
    router.push(`/${username}`)
  }

  const handleOpenEditor = async () => {
    await loadWebsiteContent()
    setShowEditor(true)
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-4">You need to be logged in to edit pages.</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push(`/${username}`)}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                title="Back to website"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Visual Editor</h1>
                <p className="text-sm text-gray-600">
                  Editing main site: {username}.localhost:3000
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Logged in as: {session.user?.name || session.user?.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Editor */}
      {showEditor ? (
        <WebsiteVisualEditor
          pageTitle="Home"
          siteSubdomain={username}
          initialContent={websiteContent}
          onSave={handleSave}
          onClose={handleClose}
        />
      ) : (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Visual Editor</h2>
              <p className="text-gray-600 mb-6">
                Edit your main website <strong>{username}.localhost:3000</strong> using the MediaWiki Visual Editor.
              </p>
              <div className="space-y-4">
                <button
                  onClick={handleOpenEditor}
                  disabled={isLoadingContent}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingContent ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                      Loading Content...
                    </>
                  ) : (
                    'Open Visual Editor'
                  )}
                </button>
                <button
                  onClick={() => router.push(`/${username}/edit`)}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                >
                  Use Code Editor Instead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
