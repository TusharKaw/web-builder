# Website Builder - Full-Stack SaaS Platform

A full-stack SaaS website builder where users can sign up, create their own websites instantly, backed by a MediaWiki farm backend. Each user's website content is stored and edited via MediaWiki API in headless mode.

## Features

- **Authentication**: NextAuth.js with Google and email login
- **Site Creation**: Users can create websites with custom subdomains
- **Visual Editor**: TipTap-based rich text editor for content creation
- **MediaWiki Backend**: Headless CMS powered by MediaWiki API
- **Instant Publishing**: Changes go live immediately
- **Admin Panel**: Platform management and user oversight
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + Tailwind CSS + TypeScript
- **Backend**: Next.js API routes + Prisma ORM
- **Authentication**: NextAuth.js
- **Database**: PostgreSQL
- **Headless CMS**: MediaWiki API
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google OAuth credentials (optional)
- MediaWiki instance with API access

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd website-builder
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your variables:

```bash
cp env.example .env.local
```

Update `.env.local` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/website_builder"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# MediaWiki API
MEDIAWIKI_API_URL="http://13.233.126.84/api.php"

# Admin emails (comma-separated)
ADMIN_EMAILS="admin@example.com,admin2@example.com"
```

### 3. Database Setup

Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma db push
```

### 4. Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin panel pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   └── [username]/        # Dynamic user sites
├── components/            # React components
│   ├── editor/           # TipTap editor
│   ├── layout/           # Layout components
│   ├── pages/            # Page management
│   └── sites/            # Site management
└── lib/                  # Utility functions
    ├── auth.ts           # NextAuth configuration
    ├── mediawiki.ts      # MediaWiki API helpers
    └── prisma.ts         # Prisma client
```

## API Endpoints

### Sites
- `GET /api/sites` - List user's sites
- `POST /api/sites` - Create new site
- `GET /api/sites/[id]` - Get site details
- `PUT /api/sites/[id]` - Update site
- `DELETE /api/sites/[id]` - Delete site

### Pages
- `GET /api/sites/[id]/pages` - List site pages
- `POST /api/sites/[id]/pages` - Create new page
- `PUT /api/sites/[id]/pages/[pageId]` - Update page
- `DELETE /api/sites/[id]/pages/[pageId]` - Delete page

## MediaWiki Integration

The application uses MediaWiki as a headless CMS:

- **Page Storage**: All content is stored in MediaWiki
- **API Access**: Content is fetched and updated via MediaWiki API
- **Instant Updates**: Changes are immediately available
- **Version Control**: MediaWiki provides built-in versioning

### MediaWiki API Functions

- `fetchPage(title, wikiUrl)` - Get rendered page content
- `savePage(title, content, token, wikiUrl)` - Save/update page
- `deletePage(title, token, wikiUrl)` - Delete page
- `listPages(wikiUrl)` - List all pages
- `getEditToken(wikiUrl)` - Get edit token for API calls

## User Flow

1. **Sign Up/Login**: Users authenticate with Google or email
2. **Create Site**: Users create a new website with custom subdomain
3. **Edit Content**: Users use the visual editor to create pages
4. **Publish**: Content is instantly published via MediaWiki API
5. **View Site**: Sites are accessible at `/[username]/[page]`

## Admin Features

- View platform statistics
- Manage all users and sites
- Monitor site activity
- Delete inactive sites

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-production-secret"
GOOGLE_CLIENT_ID="your-production-google-client-id"
GOOGLE_CLIENT_SECRET="your-production-google-client-secret"
MEDIAWIKI_API_URL="your-mediawiki-api-url"
ADMIN_EMAILS="admin@yourdomain.com"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.