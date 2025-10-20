'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import VisualEditor from '@/components/editor/VisualEditor'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function VisualEditPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [username, setUsername] = useState('')
  const [pageTitle, setPageTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setUsername(Array.isArray(resolvedParams.username) ? resolvedParams.username[0] : resolvedParams.username)
      // For main site editing, use the username as the page title
      const page = Array.isArray(resolvedParams.page) ? resolvedParams.page[0] : resolvedParams.page
      setPageTitle(page === 'Home' ? username : page)
      setIsLoading(false)
    }
    loadParams()
  }, [params, username])

  const handleSave = (content: string) => {
    console.log('Page saved:', content)
    // Optionally redirect back to the page
    router.push(`/${username}/${encodeURIComponent(pageTitle)}`)
  }

  const handleClose = () => {
    router.push(`/${username}/${encodeURIComponent(pageTitle)}`)
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
                  Editing: {pageTitle} • {username}.localhost:3000
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
        <VisualEditor
          pageTitle={pageTitle}
          siteSubdomain={username}
          onSave={handleSave}
          onClose={handleClose}
        />
      ) : (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Visual Editor</h2>
              <p className="text-gray-600 mb-6">
                Edit <strong>{pageTitle}</strong> using the MediaWiki Visual Editor.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => setShowEditor(true)}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Open Visual Editor
                </button>
                <button
                  onClick={() => router.push(`/${username}/${encodeURIComponent(pageTitle)}/edit`)}
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
