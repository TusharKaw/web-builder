const MEDIAWIKI_API_URL = process.env.MEDIAWIKI_API_URL || 'http://13.233.126.84/api.php'

export interface MediaWikiPage {
  title: string
  content: string
  html?: string
}

export interface MediaWikiEditResult {
  result: string
  pageid?: number
  title?: string
  oldrevid?: number
  newrevid?: number
}

export interface MediaWikiTokenResult {
  query: {
    tokens: {
      csrftoken: string
    }
  }
}

/**
 * Fetch a page from MediaWiki API
 */
export async function fetchPage(title: string, wikiUrl?: string): Promise<string> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'parse',
    page: title,
    format: 'json',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to fetch page')
    }
    
    return data?.parse?.text?.['*'] || ''
  } catch (error) {
    console.error('Error fetching page:', error)
    throw error
  }
}

/**
 * Get raw page content from MediaWiki API
 */
export async function fetchPageContent(title: string, wikiUrl?: string): Promise<string> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: title,
    prop: 'revisions',
    rvprop: 'content',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to fetch page content')
    }
    
    const pages = data?.query?.pages
    const pageId = Object.keys(pages)[0]
    const page = pages[pageId]
    
    if (page.missing) {
      return ''
    }
    
    return page.revisions?.[0]?.['*'] || ''
  } catch (error) {
    console.error('Error fetching page content:', error)
    throw error
  }
}

/**
 * Get edit token from MediaWiki API
 */
export async function getEditToken(wikiUrl?: string): Promise<string> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    meta: 'tokens',
    type: 'csrf',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to get edit token')
    }
    
    return data?.query?.tokens?.csrftoken || ''
  } catch (error) {
    console.error('Error getting edit token:', error)
    throw error
  }
}

/**
 * Save/Edit a page in MediaWiki
 */
export async function savePage(
  title: string, 
  content: string, 
  token?: string, 
  wikiUrl?: string
): Promise<MediaWikiEditResult> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const editToken = token || await getEditToken(wikiUrl)

  const formData = new URLSearchParams({
    action: 'edit',
    title,
    text: content,
    token: editToken,
    format: 'json',
    origin: '*'
  })

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    })
    
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to save page')
    }
    
    return data.edit
  } catch (error) {
    console.error('Error saving page:', error)
    throw error
  }
}

/**
 * Delete a page from MediaWiki
 */
export async function deletePage(
  title: string, 
  token?: string, 
  wikiUrl?: string
): Promise<any> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const deleteToken = token || await getEditToken(wikiUrl)

  const formData = new URLSearchParams({
    action: 'delete',
    title,
    token: deleteToken,
    format: 'json',
    origin: '*'
  })

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    })
    
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to delete page')
    }
    
    return data.delete
  } catch (error) {
    console.error('Error deleting page:', error)
    throw error
  }
}

/**
 * List all pages from MediaWiki
 */
export async function listPages(wikiUrl?: string): Promise<string[]> {
  const apiUrl = wikiUrl || MEDIAWIKI_API_URL
  const params = new URLSearchParams({
    action: 'query',
    list: 'allpages',
    format: 'json',
    aplimit: '500',
    origin: '*'
  })

  try {
    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.info || 'Failed to list pages')
    }
    
    return data?.query?.allpages?.map((page: any) => page.title) || []
  } catch (error) {
    console.error('Error listing pages:', error)
    throw error
  }
}

/**
 * Create a new wiki site (this would typically be handled by your wiki farm)
 */
export async function createWikiSite(subdomain: string): Promise<string> {
  // This is a placeholder - in a real implementation, you'd call your wiki farm's API
  // to create a new subwiki. For now, we'll return a constructed URL
  const wikiUrl = `http://${subdomain}.xfanstube.com/api.php`
  
  // You might want to make an API call to your wiki farm here
  // to actually create the subwiki
  
  return wikiUrl
}
