# MediaWiki REST API + CORS Configuration

## Step 1: Enable REST API in LocalSettings.php

Add these configurations to your MediaWiki `LocalSettings.php`:

```php
<?php
// Enable REST API
$wgEnableRestAPI = true;

// CORS configuration for Next.js frontend
$wgCrossSiteAJAXdomains = [
    'localhost:3000',
    'app.mysaas.com',
    '*.mysaas.com'
];

// Allow REST API from your domains
$wgRestAPIAdditionalRouteFiles = [
    'extensions/VisualEditor/VisualEditor.php'
];

// Enable CORS headers
$wgCorsAllowOrigin = [
    'http://localhost:3000',
    'https://app.mysaas.com',
    'https://*.mysaas.com'
];

// API configuration for VisualEditor
$wgAPIModules['visualeditor'] = 'ApiVisualEditor';
$wgAPIModules['visualeditoredit'] = 'ApiVisualEditorEdit';

// Enable OAuth2 for authentication
$wgOAuth2Client['client']['id'] = 'your-oauth-client-id';
$wgOAuth2Client['client']['secret'] = 'your-oauth-client-secret';
$wgOAuth2Client['client']['redirect_uri'] = 'http://app.mysaas.com/auth/callback';

// Session configuration
$wgSessionCacheType = CACHE_DB;
$wgSessionsInObjectCache = true;

// Enable API tokens
$wgEnableAPI = true;
$wgEnableWriteAPI = true;
```

## Step 2: Create Custom REST Endpoints

Create `/extensions/VisualEditor/VisualEditor.php`:

```php
<?php
// Custom VisualEditor REST endpoints
class VisualEditorRestHandler {
    
    public static function onRestInitialization( $router ) {
        $router->addRoute( '/visualeditor/page/{title}', [
            'GET' => 'getPageContent',
            'PUT' => 'savePageContent'
        ], [
            'title' => 'string'
        ]);
        
        $router->addRoute( '/visualeditor/token', [
            'GET' => 'getEditToken'
        ]);
        
        return true;
    }
    
    public static function getPageContent( $request, $response ) {
        $title = $request->getPathParam( 'title' );
        $page = WikiPage::factory( Title::newFromText( $title ) );
        
        if ( !$page->exists() ) {
            return $response->status( 404 )->json( [ 'error' => 'Page not found' ] );
        }
        
        $content = $page->getContent();
        $html = $content->getText();
        
        return $response->json( [
            'title' => $title,
            'content' => $html,
            'timestamp' => $page->getTimestamp()
        ]);
    }
    
    public static function savePageContent( $request, $response ) {
        $title = $request->getPathParam( 'title' );
        $content = $request->getBody()->getContents();
        $token = $request->getHeader( 'X-CSRF-Token' );
        
        // Verify CSRF token
        if ( !self::verifyToken( $token ) ) {
            return $response->status( 403 )->json( [ 'error' => 'Invalid token' ] );
        }
        
        $page = WikiPage::factory( Title::newFromText( $title ) );
        $page->doEditContent( 
            new WikitextContent( $content ),
            'VisualEditor edit',
            EDIT_UPDATE
        );
        
        return $response->json( [ 'success' => true ] );
    }
    
    public static function getEditToken( $request, $response ) {
        $user = RequestContext::getMain()->getUser();
        $token = $user->getEditToken();
        
        return $response->json( [ 'token' => $token ] );
    }
    
    private static function verifyToken( $token ) {
        $user = RequestContext::getMain()->getUser();
        return $user->matchEditToken( $token );
    }
}

// Register the handler
$wgHooks['RestInitialization'][] = 'VisualEditorRestHandler::onRestInitialization';
```

## Step 3: Test REST API Endpoints

Test the endpoints:

```bash
# Test page content retrieval
curl -X GET "http://13.233.126.84/rest.php/v1/visualeditor/page/Main_Page" \
  -H "Accept: application/json"

# Test token retrieval
curl -X GET "http://13.233.126.84/rest.php/v1/visualeditor/token" \
  -H "Accept: application/json"

# Test page save (requires authentication)
curl -X PUT "http://13.233.126.84/rest.php/v1/visualeditor/page/Test_Page" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: your-token" \
  -d '{"content": "New page content"}'
```

## Step 4: CORS Headers Configuration

Add to your web server configuration (Apache/Nginx):

### Apache (.htaccess or virtual host):
```apache
# Enable CORS
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-CSRF-Token"
Header always set Access-Control-Allow-Credentials "true"

# Handle preflight requests
RewriteEngine On
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```

### Nginx:
```nginx
location / {
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-CSRF-Token' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    
    if ($request_method = 'OPTIONS') {
        return 204;
    }
}
```

## Step 5: Authentication Setup

Create OAuth2 application in MediaWiki:

1. Go to `Special:OAuth2Registration`
2. Create new application:
   - Name: "Next.js Website Builder"
   - Redirect URI: `http://app.mysaas.com/auth/callback`
   - Scopes: `editpage`, `edit`, `writeapi`

3. Note down the Client ID and Secret for your Next.js app.
