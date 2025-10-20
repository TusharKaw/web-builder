// MediaWiki VisualEditor API integration
const MEDIAWIKI_API_URL = 'http://13.233.126.84/api.php'
const MEDIAWIKI_REST_URL = 'http://13.233.126.84/rest.php/v1'

export interface MediaWikiPage {
  title: string
  content: string
  timestamp: string
  user: string
}

export interface MediaWikiEditResult {
  success: boolean
  error?: string
  newrevid?: number
}

// Get CSRF token for editing
export async function getMediaWikiEditToken(): Promise<string> {
  try {
    const response = await fetch(`${MEDIAWIKI_API_URL}?action=query&format=json&meta=tokens&type=csrf&origin=*`, {
      credentials: 'include'
    })
    const data = await response.json()
    return data?.query?.tokens?.csrftoken || ''
  } catch (error) {
    console.error('Error getting MediaWiki edit token:', error)
    return ''
  }
}

// Get page content via REST API
export async function getPageContentViaREST(pageTitle: string): Promise<MediaWikiPage | null> {
  try {
    const response = await fetch(`${MEDIAWIKI_REST_URL}/visualeditor/page/${encodeURIComponent(pageTitle)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to load page: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      title: data.title,
      content: data.content,
      timestamp: data.timestamp,
      user: data.user || 'Unknown'
    }
  } catch (error) {
    console.error('Error getting page content via REST:', error)
    return null
  }
}

// Save page content via REST API
export async function savePageContentViaREST(
  pageTitle: string, 
  content: string, 
  comment: string = 'VisualEditor edit'
): Promise<MediaWikiEditResult> {
  try {
    // Get CSRF token
    const token = await getMediaWikiEditToken()
    if (!token) {
      return { success: false, error: 'Failed to get CSRF token' }
    }

    const response = await fetch(`${MEDIAWIKI_REST_URL}/visualeditor/page/${encodeURIComponent(pageTitle)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token
      },
      credentials: 'include',
      body: JSON.stringify({ 
        content,
        comment,
        minor: false
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { 
        success: false, 
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}` 
      }
    }

    const result = await response.json()
    return { 
      success: result.success || true, 
      newrevid: result.newrevid 
    }
  } catch (error) {
    console.error('Error saving page content via REST:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Alternative: Use traditional MediaWiki API for editing
export async function savePageContentViaAPI(
  pageTitle: string,
  content: string,
  comment: string = 'VisualEditor edit'
): Promise<MediaWikiEditResult> {
  try {
    // Get CSRF token
    const token = await getMediaWikiEditToken()
    if (!token) {
      return { success: false, error: 'Failed to get CSRF token' }
    }

    // Create form data for API request
    const formData = new FormData()
    formData.append('action', 'edit')
    formData.append('format', 'json')
    formData.append('title', pageTitle)
    formData.append('text', content)
    formData.append('summary', comment)
    formData.append('token', token)
    formData.append('origin', '*')

    const response = await fetch(MEDIAWIKI_API_URL, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })

    const result = await response.json()
    
    if (result.edit && result.edit.result === 'Success') {
      return { 
        success: true, 
        newrevid: result.edit.newrevid 
      }
    } else {
      return { 
        success: false, 
        error: result.edit?.error?.info || 'Edit failed' 
      }
    }
  } catch (error) {
    console.error('Error saving page content via API:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Get page content via traditional API
export async function getPageContentViaAPI(pageTitle: string): Promise<MediaWikiPage | null> {
  try {
    const response = await fetch(
      `${MEDIAWIKI_API_URL}?action=query&format=json&prop=revisions&titles=${encodeURIComponent(pageTitle)}&rvprop=content|timestamp|user&rvlimit=1&origin=*`,
      { credentials: 'include' }
    )

    const data = await response.json()
    const pages = data?.query?.pages || {}
    const pageData = Object.values(pages)[0] as any

    if (pageData?.revisions?.[0]) {
      const revision = pageData.revisions[0]
      return {
        title: pageData.title,
        content: revision.content || '',
        timestamp: revision.timestamp,
        user: revision.user
      }
    }

    return null
  } catch (error) {
    console.error('Error getting page content via API:', error)
    return null
  }
}

// Check if user is logged in to MediaWiki
export async function checkMediaWikiAuth(): Promise<boolean> {
  try {
    const response = await fetch(
      `${MEDIAWIKI_API_URL}?action=query&format=json&meta=userinfo&origin=*`,
      { credentials: 'include' }
    )
    const data = await response.json()
    return data?.query?.userinfo?.id !== 0
  } catch (error) {
    console.error('Error checking MediaWiki auth:', error)
    return false
  }
}

// Get MediaWiki user info
export async function getMediaWikiUserInfo(): Promise<{ name: string; id: number } | null> {
  try {
    const response = await fetch(
      `${MEDIAWIKI_API_URL}?action=query&format=json&meta=userinfo&origin=*`,
      { credentials: 'include' }
    )
    const data = await response.json()
    const userinfo = data?.query?.userinfo
    
    if (userinfo && userinfo.id !== 0) {
      return {
        name: userinfo.name,
        id: userinfo.id
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting MediaWiki user info:', error)
    return null
  }
}
