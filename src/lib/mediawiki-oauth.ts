// MediaWiki OAuth2 integration for Next.js
const MEDIAWIKI_OAUTH_URL = 'http://13.233.126.84'
const OAUTH_CLIENT_ID = process.env.MEDIAWIKI_OAUTH_CLIENT_ID || 'your-oauth-client-id'
const OAUTH_CLIENT_SECRET = process.env.MEDIAWIKI_OAUTH_CLIENT_SECRET || 'your-oauth-client-secret'
const OAUTH_REDIRECT_URI = process.env.MEDIAWIKI_OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/mediawiki/callback'

export interface MediaWikiOAuthToken {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
}

export interface MediaWikiUser {
  id: number
  name: string
  email?: string
  groups: string[]
}

// Generate OAuth authorization URL
export function getMediaWikiOAuthURL(): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OAUTH_CLIENT_ID,
    redirect_uri: OAUTH_REDIRECT_URI,
    scope: 'editpage edit writeapi',
    state: Math.random().toString(36).substring(2, 15) // CSRF protection
  })
  
  return `${MEDIAWIKI_OAUTH_URL}/rest.php/oauth2/authorize?${params.toString()}`
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(code: string): Promise<MediaWikiOAuthToken | null> {
  try {
    const response = await fetch(`${MEDIAWIKI_OAUTH_URL}/rest.php/oauth2/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${OAUTH_CLIENT_ID}:${OAUTH_CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: OAUTH_REDIRECT_URI
      })
    })

    if (!response.ok) {
      throw new Error(`OAuth token exchange failed: ${response.statusText}`)
    }

    const tokenData = await response.json()
    return {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      refresh_token: tokenData.refresh_token,
      scope: tokenData.scope
    }
  } catch (error) {
    console.error('Error exchanging code for token:', error)
    return null
  }
}

// Get user info using access token
export async function getMediaWikiUserInfo(accessToken: string): Promise<MediaWikiUser | null> {
  try {
    const response = await fetch(`${MEDIAWIKI_OAUTH_URL}/rest.php/oauth2/resource/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`)
    }

    const userData = await response.json()
    return {
      id: userData.sub,
      name: userData.username,
      email: userData.email,
      groups: userData.groups || []
    }
  } catch (error) {
    console.error('Error getting MediaWiki user info:', error)
    return null
  }
}

// Refresh access token
export async function refreshMediaWikiToken(refreshToken: string): Promise<MediaWikiOAuthToken | null> {
  try {
    const response = await fetch(`${MEDIAWIKI_OAUTH_URL}/rest.php/oauth2/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${OAUTH_CLIENT_ID}:${OAUTH_CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`)
    }

    const tokenData = await response.json()
    return {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      refresh_token: tokenData.refresh_token,
      scope: tokenData.scope
    }
  } catch (error) {
    console.error('Error refreshing MediaWiki token:', error)
    return null
  }
}

// Make authenticated API request
export async function makeAuthenticatedRequest(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${MEDIAWIKI_OAUTH_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
}

// Check if token is valid
export async function validateMediaWikiToken(accessToken: string): Promise<boolean> {
  try {
    const response = await makeAuthenticatedRequest('/rest.php/oauth2/resource/profile', accessToken)
    return response.ok
  } catch (error) {
    console.error('Error validating MediaWiki token:', error)
    return false
  }
}
