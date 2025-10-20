'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { exchangeCodeForToken, getMediaWikiUserInfo } from '@/lib/mediawiki-oauth'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function MediaWikiCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, update } = useSession()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const state = searchParams.get('state')

        if (error) {
          setStatus('error')
          setMessage(`OAuth error: ${error}`)
          return
        }

        if (!code) {
          setStatus('error')
          setMessage('No authorization code received')
          return
        }

        // Exchange code for token
        const token = await exchangeCodeForToken(code)
        if (!token) {
          setStatus('error')
          setMessage('Failed to exchange code for token')
          return
        }

        // Get user info
        const userInfo = await getMediaWikiUserInfo(token.access_token)
        if (!userInfo) {
          setStatus('error')
          setMessage('Failed to get user information')
          return
        }

        // Store MediaWiki credentials in session
        await update({
          ...session,
          mediawiki: {
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
            expiresIn: token.expires_in,
            user: userInfo
          }
        })

        setStatus('success')
        setMessage('Successfully connected to MediaWiki!')
        
        // Redirect back to the page they were editing
        const returnUrl = searchParams.get('return_url') || '/dashboard'
        setTimeout(() => {
          router.push(returnUrl)
        }, 2000)

      } catch (error) {
        console.error('MediaWiki OAuth callback error:', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Unknown error occurred')
      }
    }

    handleCallback()
  }, [searchParams, session, update, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting to MediaWiki</h2>
              <p className="text-gray-600">Please wait while we authenticate you...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Success!</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Redirecting you back...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Try Again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
