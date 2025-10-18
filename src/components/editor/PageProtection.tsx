'use client'

import { useState, useEffect } from 'react'
import { Shield, ShieldCheck, ShieldX, Lock, Unlock } from 'lucide-react'

interface PageProtectionProps {
  siteId: string
  pageId: string
}

export default function PageProtection({ siteId, pageId }: PageProtectionProps) {
  const [isProtected, setIsProtected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pageTitle, setPageTitle] = useState('')

  useEffect(() => {
    fetchProtectionStatus()
  }, [siteId, pageId])

  const fetchProtectionStatus = async () => {
    try {
      const response = await fetch(`/api/sites/${siteId}/pages/${pageId}/protection`)
      if (response.ok) {
        const data = await response.json()
        setIsProtected(data.isProtected)
        setPageTitle(data.pageTitle)
      }
    } catch (error) {
      console.error('Error fetching protection status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleProtection = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/sites/${siteId}/pages/${pageId}/protection`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isProtected: !isProtected
        })
      })

      if (response.ok) {
        const data = await response.json()
        setIsProtected(data.isProtected)
        // Show success message
        alert(data.message || 'Protection status updated successfully')
      } else {
        const error = await response.json()
        console.error('Protection update error:', error)
        alert(`Failed to update protection: ${error.error || error.details || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating protection:', error)
      alert('Failed to update page protection')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading protection status...</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b">
        <div className="flex items-center">
          <Shield className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-semibold">Page Protection</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Control who can edit this page
        </p>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isProtected ? (
              <ShieldCheck className="w-6 h-6 text-red-600" />
            ) : (
              <ShieldX className="w-6 h-6 text-green-600" />
            )}
            
            <div>
              <p className="font-medium text-gray-900">
                {isProtected ? 'Page is Protected' : 'Page is Unprotected'}
              </p>
              <p className="text-sm text-gray-600">
                {isProtected 
                  ? 'Only you can edit this page'
                  : 'Anyone can edit this page'
                }
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleProtection}
            disabled={saving}
            className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
              isProtected
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            } disabled:opacity-50`}
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : isProtected ? (
              <Unlock className="w-4 h-4 mr-2" />
            ) : (
              <Lock className="w-4 h-4 mr-2" />
            )}
            {saving 
              ? 'Updating...' 
              : isProtected 
                ? 'Unprotect Page' 
                : 'Protect Page'
            }
          </button>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h4 className="font-medium text-gray-900 mb-2">Protection Levels:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center">
              <ShieldX className="w-4 h-4 mr-2 text-green-600" />
              <strong>Unprotected:</strong> Anyone can edit this page
            </li>
            <li className="flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2 text-red-600" />
              <strong>Protected:</strong> Only the page owner can edit
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
