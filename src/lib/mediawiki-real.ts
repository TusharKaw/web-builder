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

// Search websites using MediaWiki (like Wikipedia)
export async function searchWebsites(query: string, limit: number = 10): Promise<any[]> {
  try {
    console.log(`[MEDIAWIKI] Searching websites for query: ${query}`)
    
    // Get all pages and filter them (since text search is disabled)
    const response = await fetch(`${MEDIAWIKI_API_URL}?action=query&format=json&list=allpages&aplimit=50&origin=*`)
    const data = await response.json()
    
    console.log(`[MEDIAWIKI] All pages response:`, data)
    
    const allPages = data?.query?.allpages || []
    console.log(`[MEDIAWIKI] Found ${allPages.length} total pages`)
    
    // Filter pages that match the query
    const filteredPages = allPages.filter((page: any) => 
      page.title.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit)
    
    console.log(`[MEDIAWIKI] Found ${filteredPages.length} matching pages`)
    
    return filteredPages.map((page: any) => ({
      title: page.title,
      snippet: `Page: ${page.title}`,
      size: 0,
      wordcount: 0,
      timestamp: new Date().toISOString(),
      url: `http://13.233.126.84/index.php?title=${encodeURIComponent(page.title)}`,
      type: 'mediawiki'
    }))
  } catch (error) {
    console.error(`[MEDIAWIKI] Error searching websites:`, error)
    return []
  }
}

// Get search suggestions (autocomplete)
export async function getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
  try {
    console.log(`[MEDIAWIKI] Getting search suggestions for: ${query}`)
    
    // Get all pages and filter them for suggestions
    const response = await fetch(`${MEDIAWIKI_API_URL}?action=query&format=json&list=allpages&aplimit=50&origin=*`)
    const data = await response.json()
    
    const allPages = data?.query?.allpages || []
    
    // Filter pages that start with the query
    const suggestions = allPages
      .filter((page: any) => 
        page.title.toLowerCase().startsWith(query.toLowerCase())
      )
      .slice(0, limit)
      .map((page: any) => page.title)
    
    console.log(`[MEDIAWIKI] Found ${suggestions.length} suggestions`)
    
    return suggestions
  } catch (error) {
    console.error(`[MEDIAWIKI] Error getting search suggestions:`, error)
    return []
  }
}

// Search for user-created websites (subdomains)
export async function searchUserWebsites(query: string, limit: number = 10): Promise<any[]> {
  try {
    console.log(`[MEDIAWIKI] Searching user websites for query: ${query}`)
    
    // Get all pages and filter for website-like content
    const response = await fetch(`${MEDIAWIKI_API_URL}?action=query&format=json&list=allpages&aplimit=50&origin=*`)
    const data = await response.json()
    
    const allPages = data?.query?.allpages || []
    console.log(`[MEDIAWIKI] Found ${allPages.length} total pages`)
    
    // Filter pages that could be websites (exclude system pages)
    const websitePages = allPages.filter((page: any) => {
      const title = page.title.toLowerCase()
      // Exclude system pages and include pages that could be websites
      return !title.includes('special:') && 
             !title.includes('user:') && 
             !title.includes('template:') &&
             !title.includes('category:') &&
             !title.includes('file:') &&
             !title.includes('help:') &&
             !title.includes('main page') &&
             title.includes(query.toLowerCase())
    }).slice(0, limit)
    
    console.log(`[MEDIAWIKI] Found ${websitePages.length} website pages`)
    
    return websitePages.map((page: any) => ({
      name: page.title,
      description: `Website: ${page.title}`,
      subdomain: page.title.toLowerCase().replace(/\s+/g, ''),
      logo: null,
      owner: 'Unknown',
      created_at: new Date().toISOString(),
      url: `/${page.title.toLowerCase().replace(/\s+/g, '')}`,
      type: 'website'
    }))
  } catch (error) {
    console.error(`[MEDIAWIKI] Error searching user websites:`, error)
    return []
  }
}

// Get all websites (for browsing)
export async function getAllWebsites(limit: number = 50): Promise<any[]> {
  try {
    console.log(`[MEDIAWIKI] Getting all websites`)
    
    const response = await fetch(`${MEDIAWIKI_API_URL}?action=query&format=json&list=allpages&aplimit=${limit}&origin=*`)
    const data = await response.json()
    
    const websites = data?.query?.allpages || []
    console.log(`[MEDIAWIKI] Found ${websites.length} websites`)
    
    return websites.map((site: any) => ({
      title: site.title,
      pageid: site.pageid,
      url: `http://13.233.126.84/index.php?title=${encodeURIComponent(site.title)}`
    }))
  } catch (error) {
    console.error(`[MEDIAWIKI] Error getting all websites:`, error)
    return []
  }
}

// Recent changes (edits/logs) from MediaWiki
export interface MediaWikiRecentChange {
  type: string
  ns?: number
  title: string
  revid?: number
  old_revid?: number
  rcid?: number
  timestamp: string
  user: string
  comment?: string
  logtype?: string
  logaction?: string
}

export async function getRecentChanges(limit: number = 50): Promise<MediaWikiRecentChange[]> {
  try {
    const url = `${MEDIAWIKI_API_URL}?action=query&format=json&list=recentchanges&rcprop=title|timestamp|user|comment|ids|loginfo&rclimit=${limit}&origin=*`
    const response = await fetch(url)
    const data = await response.json()
    const rc = (data?.query?.recentchanges || []) as any[]
    return rc.map((item: any) => ({
      type: item.type,
      ns: item.ns,
      title: item.title,
      revid: item.revid,
      old_revid: item.old_revid,
      rcid: item.rcid,
      timestamp: item.timestamp,
      user: item.user,
      comment: item.comment,
      logtype: item.logtype,
      logaction: item.logaction
    }))
  } catch (error) {
    console.error('[MEDIAWIKI] Error fetching recent changes:', error)
    return []
  }
}

// CreateWiki/ManageWiki logs (new subwikis)
export interface MediaWikiCreateWikiLog {
  title: string
  timestamp: string
  user: string
  comment?: string
  logtype: string
  action: string
}

export async function getCreateWikiLogs(limit: number = 50): Promise<MediaWikiCreateWikiLog[]> {
  try {
    // Try CreateWiki log type first; fallback to ManageWiki or all logs filtered client-side
    const tryTypes = ['createwiki', 'managewiki', 'newusers']
    for (const letype of tryTypes) {
      try {
        const url = `${MEDIAWIKI_API_URL}?action=query&format=json&list=logevents&letype=${letype}&leprop=title|timestamp|user|comment|type|action&lelimit=${limit}&origin=*`
        const resp = await fetch(url)
        const data = await resp.json()
        const events = (data?.query?.logevents || []) as any[]
        if (events.length > 0) {
          return events.map(ev => ({
            title: ev.title || '',
            timestamp: ev.timestamp,
            user: ev.user,
            comment: ev.comment,
            logtype: ev.type,
            action: ev.action
          }))
        }
      } catch (_e) {
        // continue to next type
      }
    }
    return []
  } catch (error) {
    console.error('[MEDIAWIKI] Error fetching CreateWiki logs:', error)
    return []
  }
}
