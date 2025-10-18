// Real MediaWiki integration that actually works
const MEDIAWIKI_API_URL = 'http://13.233.126.84/api.php'

export interface MediaWikiFile {
  title: string
  url: string
  size?: number
  mime?: string
}

export interface MediaWikiRevision {
  revid: number
  content: string
  comment: string
  minor: boolean
  timestamp: string
  user: string
  userid: number
}

// Get CSRF token for authenticated actions
export async function getCSRFToken(): Promise<string> {
  try {
    const response = await fetch(`${MEDIAWIKI_API_URL}?action=query&format=json&meta=tokens&type=csrf&origin=*`)
    const data = await response.json()
    return data?.query?.tokens?.csrftoken || ''
  } catch (error) {
    console.error('Error getting CSRF token:', error)
    return ''
  }
}

// Upload file to MediaWiki
export async function uploadFileToMediaWiki(
  filename: string,
  fileContent: Buffer,
  comment: string = ''
): Promise<boolean> {
  try {
    console.log(`[MEDIAWIKI] Uploading file: ${filename}`)
    
    // Get CSRF token
    const token = await getCSRFToken()
    if (!token) {
      throw new Error('Failed to get CSRF token')
    }
    
    // Create form data
    const formData = new FormData()
    formData.append('action', 'upload')
    formData.append('format', 'json')
    formData.append('filename', filename)
    formData.append('file', new Blob([fileContent]), filename)
    formData.append('comment', comment)
    formData.append('token', token)
    formData.append('origin', '*')
    
    // Upload file
    const response = await fetch(MEDIAWIKI_API_URL, {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    console.log(`[MEDIAWIKI] Upload result:`, result)
    
    if (result.upload && result.upload.result === 'Success') {
      console.log(`[MEDIAWIKI] File uploaded successfully: ${filename}`)
      return true
    } else {
      console.error(`[MEDIAWIKI] Upload failed:`, result.upload?.error || 'Unknown error')
      return false
    }
  } catch (error) {
    console.error(`[MEDIAWIKI] Upload error:`, error)
    return false
  }
}

// Get files from MediaWiki
export async function getFilesFromMediaWiki(pageTitle: string): Promise<MediaWikiFile[]> {
  try {
    console.log(`[MEDIAWIKI] Getting files for page: ${pageTitle}`)
    
    const response = await fetch(`${MEDIAWIKI_API_URL}?action=query&format=json&prop=images&titles=${encodeURIComponent(pageTitle)}&origin=*`)
    const data = await response.json()
    
    const pages = data?.query?.pages || {}
    const pageData = Object.values(pages)[0] as any
    
    if (pageData?.images) {
      console.log(`[MEDIAWIKI] Found ${pageData.images.length} files`)
      return pageData.images.map((img: any) => ({
        title: img.title,
        url: `http://13.233.126.84/index.php?title=File:${encodeURIComponent(img.title.replace('File:', ''))}`,
        mime: 'image/jpeg' // Default for now
      }))
    }
    
    return []
  } catch (error) {
    console.error(`[MEDIAWIKI] Error getting files:`, error)
    return []
  }
}

// Get page revision history from MediaWiki
export async function getPageHistoryFromMediaWiki(pageTitle: string, limit: number = 50): Promise<MediaWikiRevision[]> {
  try {
    console.log(`[MEDIAWIKI] Getting history for page: ${pageTitle}`)
    
    const response = await fetch(`${MEDIAWIKI_API_URL}?action=query&format=json&prop=revisions&titles=${encodeURIComponent(pageTitle)}&rvlimit=${limit}&rvprop=content|timestamp|user|comment|ids&origin=*`)
    const data = await response.json()
    
    const pages = data?.query?.pages || {}
    const pageData = Object.values(pages)[0] as any
    
    if (pageData?.revisions) {
      console.log(`[MEDIAWIKI] Found ${pageData.revisions.length} revisions`)
      return pageData.revisions.map((rev: any) => ({
        revid: rev.revid,
        content: rev.content || '',
        comment: rev.comment || '',
        minor: rev.minor || false,
        timestamp: rev.timestamp,
        user: rev.user,
        userid: rev.userid
      }))
    }
    
    return []
  } catch (error) {
    console.error(`[MEDIAWIKI] Error getting history:`, error)
    return []
  }
}

// Get specific revision content from MediaWiki
export async function getRevisionContentFromMediaWiki(revid: number): Promise<string> {
  try {
    console.log(`[MEDIAWIKI] Getting content for revision: ${revid}`)
    
    const response = await fetch(`${MEDIAWIKI_API_URL}?action=query&format=json&prop=revisions&revids=${revid}&rvprop=content&origin=*`)
    const data = await response.json()
    
    const pages = data?.query?.pages || {}
    const pageData = Object.values(pages)[0] as any
    
    if (pageData?.revisions?.[0]?.content) {
      return pageData.revisions[0].content
    }
    
    return ''
  } catch (error) {
    console.error(`[MEDIAWIKI] Error getting revision content:`, error)
    return ''
  }
}

// Edit page in MediaWiki
export async function editPageInMediaWiki(
  pageTitle: string,
  content: string,
  comment: string = '',
  isMinor: boolean = false
): Promise<boolean> {
  try {
    console.log(`[MEDIAWIKI] Editing page: ${pageTitle}`)
    
    // Get CSRF token
    const token = await getCSRFToken()
    if (!token) {
      throw new Error('Failed to get CSRF token')
    }
    
    // Create form data
    const formData = new FormData()
    formData.append('action', 'edit')
    formData.append('format', 'json')
    formData.append('title', pageTitle)
    formData.append('text', content)
    formData.append('summary', comment)
    formData.append('minor', isMinor ? '1' : '0')
    formData.append('token', token)
    formData.append('origin', '*')
    
    // Edit page
    const response = await fetch(MEDIAWIKI_API_URL, {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    console.log(`[MEDIAWIKI] Edit result:`, result)
    
    if (result.edit && result.edit.result === 'Success') {
      console.log(`[MEDIAWIKI] Page edited successfully: ${pageTitle}`)
      return true
    } else {
      console.error(`[MEDIAWIKI] Edit failed:`, result.edit?.error || 'Unknown error')
      return false
    }
  } catch (error) {
    console.error(`[MEDIAWIKI] Edit error:`, error)
    return false
  }
}

// Get page content from MediaWiki
export async function getPageContentFromMediaWiki(pageTitle: string): Promise<string> {
  try {
    console.log(`[MEDIAWIKI] Getting content for page: ${pageTitle}`)
    
    const response = await fetch(`${MEDIAWIKI_API_URL}?action=query&format=json&prop=revisions&titles=${encodeURIComponent(pageTitle)}&rvprop=content&rvlimit=1&origin=*`)
    const data = await response.json()
    
    const pages = data?.query?.pages || {}
    const pageData = Object.values(pages)[0] as any
    
    if (pageData?.revisions?.[0]?.content) {
      return pageData.revisions[0].content
    }
    
    return ''
  } catch (error) {
    console.error(`[MEDIAWIKI] Error getting page content:`, error)
    return ''
  }
}
