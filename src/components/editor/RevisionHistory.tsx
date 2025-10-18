'use client'

import { useState, useEffect } from 'react'
import { History, Eye, RotateCcw, User, Clock, MessageSquare } from 'lucide-react'

interface Revision {
  id: string
  content: string
  comment: string | null
  isMinor: boolean
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface RevisionHistoryProps {
  siteId: string
  pageId: string
  onRestore?: (content: string) => void
}

export default function RevisionHistory({ siteId, pageId, onRestore }: RevisionHistoryProps) {
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchRevisions()
  }, [siteId, pageId])

  const fetchRevisions = async () => {
    try {
      console.log(`[REVISION HISTORY] Fetching revisions for siteId: ${siteId}, pageId: ${pageId}`)
      
      // Get MediaWiki revisions
      const mediawikiResponse = await fetch(`/api/sites/${siteId}/pages/${pageId}/mediawiki-revisions`)
      console.log(`[REVISION HISTORY] MediaWiki response status: ${mediawikiResponse.status}`)
      
      if (mediawikiResponse.ok) {
        const data = await mediawikiResponse.json()
        console.log(`[REVISION HISTORY] MediaWiki data:`, data)
        
        // Convert MediaWiki revisions to our format
        const allRevisions = (data.mediawikiHistory || []).map((rev: any) => ({
          id: `mw-${rev.revid}`,
          content: rev.content,
          comment: rev.comment,
          isMinor: rev.minor,
          createdAt: rev.timestamp,
          user: {
            id: rev.userid,
            name: rev.user,
            email: rev.user
          }
        }))
        console.log(`[REVISION HISTORY] MediaWiki revisions:`, allRevisions)
        setRevisions(allRevisions)
      } else {
        console.log(`[REVISION HISTORY] MediaWiki failed`)
        setRevisions([])
      }
    } catch (error) {
      console.error('Error fetching revisions:', error)
      setRevisions([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewRevision = (revision: Revision) => {
    setSelectedRevision(revision)
    setShowModal(true)
  }

  const handleRestoreRevision = async (revision: Revision) => {
    if (!onRestore) return

    try {
      // Check if it's a MediaWiki revision
      const isMediaWikiRevision = revision.id.startsWith('mw-')
      
      const response = await fetch(`/api/sites/${siteId}/pages/${pageId}/mediawiki-revisions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'restore',
          revid: isMediaWikiRevision ? revision.id.replace('mw-', '') : revision.id,
          content: revision.content,
          comment: `Restored to revision from ${new Date(revision.createdAt).toLocaleString()}`
        })
      })

      if (response.ok) {
        onRestore(revision.content)
        setShowModal(false)
        setSelectedRevision(null)
        // Refresh revisions
        fetchRevisions()
        alert('Revision restored successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to restore revision: ${error.error}`)
      }
    } catch (error) {
      console.error('Error restoring revision:', error)
      alert('Failed to restore revision')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getUserDisplayName = (user: Revision['user']) => {
    return user.name || user.email.split('@')[0]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading revisions...</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b">
        <div className="flex items-center">
          <History className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-semibold">Revision History</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {revisions.length} revision{revisions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {revisions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <History className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No revisions found</p>
            <p className="text-sm mt-1">Revisions will appear here when you edit this page</p>
          </div>
        ) : (
          <div className="divide-y">
            {revisions.map((revision) => (
              <div key={revision.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-sm">
                        {getUserDisplayName(revision.user)}
                      </span>
                      {revision.isMinor && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          minor
                        </span>
                      )}
                    </div>
                    
                    {revision.comment && (
                      <div className="flex items-start space-x-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-sm text-gray-600">{revision.comment}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(revision.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleViewRevision(revision)}
                      className="flex items-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => handleRestoreRevision(revision)}
                      className="flex items-center px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Restore
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revision Preview Modal */}
      {showModal && selectedRevision && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Revision Preview</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span><strong>User:</strong> {getUserDisplayName(selectedRevision.user)}</span>
                  <span><strong>Date:</strong> {formatDate(selectedRevision.createdAt)}</span>
                  {selectedRevision.isMinor && (
                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                      minor edit
                    </span>
                  )}
                </div>
                {selectedRevision.comment && (
                  <div className="mt-2">
                    <strong>Comment:</strong> {selectedRevision.comment}
                  </div>
                )}
              </div>
              
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedRevision.content }}
              />
            </div>
            
            <div className="p-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleRestoreRevision(selectedRevision)}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors"
              >
                Restore This Revision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
