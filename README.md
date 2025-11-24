# TikTok Scraper Web Application

A comprehensive TikTok data extraction dashboard with modern dark UI and analytics features.

## Features

- **Multiple Scraping Modes**: Hashtag, Profile, Search, and Video URL scraping
- **Modern Dark UI**: Professional dashboard with gradient accents and smooth interactions
- **Real-time Analytics**: Charts showing top videos and engagement distribution
- **Data Export**: Export results to CSV or JSON format
- **History Tracking**: Recent scrapes saved to localStorage with ability to reload
- **Database Persistence**: All scraping jobs and results stored in Supabase
- **Responsive Design**: Works seamlessly on mobile and desktop

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- Lucide React for icons
- Vite for build tooling

### Backend
- Supabase (PostgreSQL database, Edge Functions)
- Apify TikTok Scraper Actor API

## Architecture

### Database Schema

#### scraping_jobs
- `id`: UUID primary key
- `created_at`: Timestamp
- `mode`: Scraping mode (hashtag, profile, search, video)
- `input_data`: Text input data
- `results_count`: Number of results
- `status`: Job status (pending, completed, failed)
- `error_message`: Error details if failed
- `settings`: JSON with scraping configuration

#### scraping_results
- `id`: UUID primary key
- `job_id`: Reference to scraping_jobs
- `video_id`: TikTok video ID
- `author_id`: Author ID
- `author_name`: Author username
- `text`: Video description
- `play_count`: View count
- `digg_count`: Like count
- `comment_count`: Comment count
- `share_count`: Share count
- `share_url`: Video URL
- `thumbnail_url`: Video thumbnail
- `created_at`: Timestamp

### Edge Function: tiktok-scraper

Located at: `supabase/functions/tiktok-scraper/index.ts`

**Purpose**: Integrates with Apify TikTok Scraper Actor API to fetch TikTok data

**Flow**:
1. Receives scraping parameters from frontend
2. Constructs Apify API request based on mode
3. Calls Apify synchronous endpoint
4. Stores job record in database
5. Stores individual results in database
6. Returns data to frontend

**Environment Variables Required**:
- `APIFY_TOKEN`: Apify API token (needs to be configured)
- `SUPABASE_URL`: Auto-configured
- `SUPABASE_SERVICE_ROLE_KEY`: Auto-configured

## Setup Instructions

### 1. Backend Setup (Complete)
- [x] Database tables created
- [x] RLS policies configured
- [x] Edge function code written
- [ ] **APIFY_TOKEN needs to be added to Supabase secrets**
- [ ] Edge function needs to be deployed

### 2. Frontend Setup (Complete)
- [x] React application built
- [x] Components created
- [x] Supabase client configured
- [x] Build successful

## Usage

1. **Select Scraping Mode**: Choose between Hashtag, Profile, Search, or Video URL
2. **Enter Inputs**: Add your search terms (one per line)
3. **Configure Options**: Set results per page, sorting, date filters, etc.
4. **Start Scraping**: Click "Start Scraping" button
5. **View Results**: See results in table with analytics charts
6. **Export Data**: Download results as CSV or JSON
7. **Access History**: Click recent scrapes to reload previous results

## API Endpoints

### Supabase Edge Function
**Endpoint**: `https://xcbufsemfbklgbcmkitn.supabase.co/functions/v1/tiktok-scraper`

**Method**: POST

**Request Body**:
```json
{
  "mode": "hashtag",
  "inputs": ["fyp", "foryou"],
  "resultsPerPage": 20,
  "profileSorting": "latest",
  "excludePinnedPosts": false,
  "dateFilter": "7",
  "proxyCountry": "US"
}
```

**Response**:
```json
{
  "data": {
    "jobId": "uuid",
    "items": [...],
    "count": 50
  }
}
```

## Development

### Run Development Server
```bash
cd tiktok-scraper
pnpm install
pnpm run dev
```

### Build for Production
```bash
pnpm run build
```

### Preview Production Build
```bash
pnpm run preview
```

## Project Status

### Completed
- Database schema and RLS policies
- Edge function implementation
- Frontend application with all features
- Dark theme UI
- Analytics charts
- Export functionality
- History panel
- Responsive design

### Pending
- APIFY_TOKEN configuration
- Edge function deployment
- Production testing
- Final deployment

## Next Steps

1. **Configure APIFY_TOKEN**: Add the Apify API token as a Supabase secret
2. **Deploy Edge Function**: Deploy the tiktok-scraper edge function
3. **Test Integration**: Test the complete flow end-to-end
4. **Deploy to Production**: Build and deploy the frontend application
