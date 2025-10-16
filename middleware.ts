import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
  console.log(`Middleware: Processing request for hostname: ${hostname}, path: ${request.nextUrl.pathname}`)
  
  // Check if this is a subdomain request (not localhost:3000 or www.localhost:3000)
  const isSubdomain = hostname.includes('.localhost:3000') && !hostname.startsWith('www.')
  
  console.log(`Middleware: Is subdomain? ${isSubdomain}`)
  
  if (isSubdomain) {
    // Extract the subdomain
    const subdomain = hostname.split('.')[0]
    console.log(`Middleware: Extracted subdomain: ${subdomain}`)
    
    // Only handle subdomains that are not 'www' or empty
    if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
      // Rewrite to the dynamic route
      url.pathname = `/${subdomain}${url.pathname}`
      console.log(`Middleware: Rewriting ${hostname}${request.nextUrl.pathname} to ${url.pathname}`)
      return NextResponse.rewrite(url)
    }
  }
  
  console.log(`Middleware: No rewrite needed, continuing...`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
