import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services';
import { ScraperForm } from '../components/ScraperForm';
import { ResultsTable } from '../components/ResultsTable';
import { CommentsTable } from '../components/CommentsTable';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import { ProfileAudit } from '../components/ProfileAudit';
import { TikTokLoader } from '../components/TikTokLoader';
import { secureFetch, checkClientRateLimit, logSecurityEvent, getCsrfToken } from '../lib/security';
import { getDailyUsageStats } from '../lib/api';
import { LayoutDashboard, LogOut } from 'lucide-react';

interface ScrapingResult {
  id: string;
  text: string;
  authorMeta?: {
    id: string;
    name: string;
  };
  author?: {
    id: string;
    uniqueId: string;
  };
  playCount?: number;
  diggCount?: number;
  commentCount?: number;
  shareCount?: number;
  stats?: {
    playCount: number;
    diggCount: number;
    commentCount: number;
    shareCount: number;
  };
  webVideoUrl?: string;
  shareUrl?: string;
  covers?: {
    default: string;
  };
  videoMeta?: {
    coverUrl: string;
  };
}

interface ScraperFormData {
  mode: 'hashtag' | 'profile' | 'search' | 'video';
  inputs: string[];
  resultsPerPage: number;
  profileSorting: 'latest' | 'popular' | 'oldest';
  excludePinnedPosts: boolean;
  dateFilter: string;
  proxyCountry: string;
}

export function HomePage() {
  const [results, setResults] = useState<ScrapingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [profileAuditData, setProfileAuditData] = useState<any>(null);
  const [currentMode, setCurrentMode] = useState<string>('hashtag');
  const [profileName, setProfileName] = useState<string>('');
  const [highlightedVideoId, setHighlightedVideoId] = useState<string | null>(null);
  const [videoAuditData, setVideoAuditData] = useState<any>(null);
  const [videoAuditLoading, setVideoAuditLoading] = useState(false);
  const [videoAuditError, setVideoAuditError] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const { user, signOut } = useAuth();

  // Load usage stats on mount
  React.useEffect(() => {
    if (user) {
      getDailyUsageStats().then(stats => setUsageStats(stats));
    }
  }, [user]);

  const handleVideoHighlight = (videoId: string | null) => {
    setHighlightedVideoId(videoId);
    if (videoId === null) {
      // Clear highlight after a delay for visual feedback
      setTimeout(() => setHighlightedVideoId(null), 2000);
    }
  };

  const handleScrape = async (formData: ScraperFormData) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setProfileAuditData(null);
    setCurrentMode(formData.mode);
    setHighlightedVideoId(null);

    // Extract profile name for audit display
    if (formData.mode === 'profile' && formData.inputs.length > 0) {
      const firstInput = formData.inputs[0];
      setProfileName(firstInput.replace('@', '').trim());
    }

    try {
      // Check client-side rate limit first
      if (!checkClientRateLimit('tiktok-scraper')) {
        throw new Error('Przekroczono limit żądań. Spróbuj ponownie za chwilę.');
      }

      // Log security event
      logSecurityEvent('scraper_request_initiated', {
        mode: formData.mode,
        inputCount: formData.inputs.length,
        resultsPerPage: formData.resultsPerPage
      });

      // Prepare headers
      const { data: { session } } = await supabase.auth.getSession();
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': anonKey
      };

      // Only add Authorization header if user has a valid session
      // Without it, proxy will use demo mode
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Add CSRF token if available
      try {
        const csrfToken = await getCsrfToken();
        headers['X-CSRF-Token'] = csrfToken;
      } catch (error) {
        // CSRF token is optional - continue without it
      }

      // Make request to tiktok-scraper endpoint
      let response: Response;

      // Build request body based on mode
      const requestBody: any = {
        mode: formData.mode,
        inputs: formData.inputs,
        resultsPerPage: formData.resultsPerPage,
        profileSorting: formData.profileSorting,
        excludePinnedPosts: formData.excludePinnedPosts,
        dateFilter: formData.dateFilter,
        proxyCountry: formData.proxyCountry,
      };

      // For video mode, use comments scraper actor
      if (formData.mode === 'video') {
        requestBody.actorId = 'BDec00yAmCm1QbMEI';
      }

      console.log('📤 Sending request to tiktok-scraper:', requestBody);

      // Determine API URL - use direct Supabase Edge Function URL on production (GitHub Pages)
      // or local proxy in development
      const isProduction = import.meta.env.PROD;
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const apiUrl = isProduction && apiBaseUrl
        ? apiBaseUrl  // Direct Supabase Edge Function URL
        : '/api/tiktok-scraper';  // Local proxy

      console.log('📤 Environment debug:', {
        isProduction,
        apiBaseUrl: apiBaseUrl || '(empty)',
        apiUrl,
        hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '(empty)'
      });

      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        });
      } catch (fetchError: any) {
        console.error('Fetch error:', fetchError);
        // Handle network errors (CORS, connection refused, etc.)
        if (fetchError.name === 'TypeError' || fetchError.message?.includes('fetch')) {
          throw new Error('Błąd połączenia z serwerem. Sprawdź połączenie internetowe lub spróbuj ponownie za chwilę.');
        }
        throw new Error(fetchError.message || 'Nie udało się połączyć z serwerem.');
      }

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (parseError) {
          // If response is not JSON, use status text
          throw new Error(`Błąd serwera (${response.status}): ${response.statusText || 'Nie udało się przetworzyć żądania'}`);
        }

        // Handle specific security errors
        if (response.status === 429) {
          logSecurityEvent('rate_limit_hit', { status: response.status });
          throw new Error(errorData.error?.message || 'Przekroczono limit żądań. Spróbuj ponownie za chwilę.');
        }

        if (response.status === 403) {
          logSecurityEvent('security_validation_failed', {
            status: response.status,
            errorCode: errorData.error?.code
          });

          if (errorData.error?.code === 'CSRF_INVALID') {
            throw new Error('Problem z bezpieczeństwem. Odśwież stronę i spróbuj ponownie.');
          }

          if (errorData.error?.code === 'LIMIT_EXCEEDED') {
            throw new Error(errorData.error.message);
          }
        }

        throw new Error(errorData.error?.message || `Błąd serwera (${response.status}): Nie udało się przetworzyć żądania.`);
      }

      const responseData = await response.json();

      if (responseData?.error) {
        throw new Error(responseData.error.message);
      }

      const data = responseData?.data || responseData;
      const items = data?.items || [];
      const profileAudit = data?.profileAudit;

      // Debug log - sprawdź jakie dane przychodzą z API
      console.log('🔍 DEBUG - profileAudit raw data:', JSON.stringify(profileAudit, null, 2));
      console.log('🔍 DEBUG - profileAudit fields:', {
        hashtag_feedback_text: profileAudit?.hashtag_feedback_text?.substring(0, 100),
        cta_analysis_text: profileAudit?.cta_analysis_text?.substring(0, 100),
        seo_analysis_text: profileAudit?.seo_analysis_text?.substring(0, 100),
        format_insights_text: profileAudit?.format_insights_text?.substring(0, 100),
        content_niche_alignment_text: profileAudit?.content_niche_alignment_text?.substring(0, 100),
      });

      // Validation: Check for empty results in profile mode
      if (formData.mode === 'profile' && items.length === 0) {
        const profileInput = formData.inputs[0] || '';
        throw new Error(
          `Nie znaleziono profilu "${profileInput.replace('@', '')}"!\n\n` +
          'Sprawdź czy:\n' +
          '• Nazwa profilu jest poprawna (wielkość liter ma znaczenie)\n' +
          '• Profil istnieje i jest publiczny\n' +
          '• Nie pomyliłeś nazwy użytkownika z nazą wyświetlaną\n\n' +
          'Poprawny format: @username (bez spacji i znaków specjalnych)'
        );
      }

      // Validation: Check for empty results in video mode
      if (formData.mode === 'video' && items.length === 0) {
        throw new Error(
          'Nie udało się pobrać komentarzy z tego filmu!\n\n' +
          'Sprawdź czy:\n' +
          '• URL filmu jest poprawny\n' +
          '• Film jest publiczny (nie prywatny)\n' +
          '• Film ma włączone komentarze\n' +
          '• Film nie został usunięty'
        );
      }

      setResults(items);
      setJobId(data?.jobId || null);

      // Set profile audit data if available and in profile mode
      if (formData.mode === 'profile' && profileAudit) {
        setProfileAuditData(profileAudit);
      }

      // For video mode with comments scraper, automatically trigger video analysis
      if (formData.mode === 'video' && items.length > 0) {
        console.log('📹 Video mode detected - automatically triggering video analysis');
        console.log('📹 Full API response data:', data);
        console.log('📹 Video info from response:', data?.videoInfo || data?.video || 'no video info');

        // Comments are already in items array
        const comments = items;

        // We need to get video details - use first input URL
        const videoUrl = formData.inputs[0];

        // Trigger video analysis automatically
        setTimeout(async () => {
          try {
            setVideoAuditLoading(true);
            setVideoAuditError(null);

            console.log('📊 Auto-analyzing video:', videoUrl);
            console.log('📊 Comments count:', comments.length);

            // Try to get session, but don't require it (demo mode works without)
            const { data: { session } } = await supabase.auth.getSession();

            console.log('📊 Session status:', {
              hasSession: !!session,
              hasAccessToken: !!session?.access_token,
              mode: session ? 'authenticated' : 'demo'
            });

            // Use direct Edge Function URL on production (GitHub Pages) or local proxy in development
            const videoAnalyzerBaseUrl = import.meta.env.VITE_VIDEO_ANALYZER_URL || '';
            const analyzerUrl = isProduction && videoAnalyzerBaseUrl
              ? videoAnalyzerBaseUrl  // Direct Supabase Edge Function URL
              : '/api/video-analyzer';  // Local proxy
            console.log('📊 Calling video-analyzer at:', analyzerUrl, '(production:', isProduction, ')');

            // Build headers - only add Authorization if we have a session
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const analyzerHeaders: Record<string, string> = {
              'Content-Type': 'application/json',
              'apikey': anonKey
            };
            if (session?.access_token) {
              analyzerHeaders['Authorization'] = `Bearer ${session.access_token}`;
            }

            const analyzerResponse = await fetch(
              analyzerUrl,
              {
                method: 'POST',
                headers: analyzerHeaders,
                body: JSON.stringify({
                  videoId: null, // We don't have video ID from URL scraping
                  videoUrl: videoUrl,
                  comments: comments,
                  profileVideos: [], // No profile context in direct video mode
                }),
              }
            );

            console.log('📊 video-analyzer response status:', analyzerResponse.status);

            if (!analyzerResponse.ok) {
              const errorText = await analyzerResponse.text();
              console.error('📊 video-analyzer error response:', errorText);
              let errorData;
              try {
                errorData = JSON.parse(errorText);
              } catch {
                errorData = { error: errorText };
              }
              throw new Error(errorData.error || 'Nie udało się przeanalizować wideo');
            }

            const analyzerData = await analyzerResponse.json();

            // Try to extract video thumbnail from TikTok oEmbed API
            let videoThumbnail = '';
            try {
              const oEmbedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
              const oEmbedResponse = await fetch(oEmbedUrl);
              if (oEmbedResponse.ok) {
                const oEmbedData = await oEmbedResponse.json();
                videoThumbnail = oEmbedData.thumbnail_url || '';
                console.log('📹 Got thumbnail from oEmbed:', videoThumbnail);
              }
            } catch (oEmbedError) {
              console.log('📹 Could not fetch oEmbed thumbnail:', oEmbedError);
            }

            setVideoAuditData({
              videoUrl: videoUrl,
              videoThumbnail: videoThumbnail,
              videoCaption: '', // We don't have caption from URL scraping
              authorUsername: '', // We don't have author from URL scraping
              metrics: analyzerData.metrics,
              auditData: analyzerData.llm_analysis,
            });

            // Scroll to video audit
            setTimeout(() => {
              document.getElementById('video-audit-section')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            }, 100);

          } catch (err: any) {
            console.error('Auto video analysis error:', err);
            setVideoAuditError(err.message || 'Nie udało się przeanalizować wideo');
          } finally {
            setVideoAuditLoading(false);
          }
        }, 500);
      }

      // Save to localStorage
      const recentScrapes = JSON.parse(localStorage.getItem('recentScrapes') || '[]');
      recentScrapes.unshift({
        id: data?.jobId,
        mode: formData.mode,
        inputs: formData.inputs,
        count: items.length,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('recentScrapes', JSON.stringify(recentScrapes.slice(0, 3)));

      // Log successful operation
      logSecurityEvent('scraper_request_completed', {
        mode: formData.mode,
        itemsCount: items.length,
        jobId: data?.jobId
      });

    } catch (err: any) {
      console.error('Scraping error:', err);

      // Log error
      logSecurityEvent('scraper_request_failed', {
        error: err.message,
        mode: formData.mode
      });

      setError(err.message || 'Nie udało się zaudytować danych TikTok. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/tokacademy_logo_rozowe.png" alt="TokAcademy" className="w-10 h-10 object-cover rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  TikTok Audyt
                </h1>
                <p className="text-sm text-gray-400">Profesjonalny panel do podglądania konkurencji</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    to="/panel/audyty"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-gray-100 border border-gray-700 rounded-lg hover:border-gray-600"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Audyty Profili
                  </Link>
                  <Link
                    to="/panel/audyty-wideo"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-gray-100 border border-gray-700 rounded-lg hover:border-gray-600"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Audyty Wideo
                  </Link>
                  <Link
                    to="/panel/plan"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-gray-100 border border-gray-700 rounded-lg hover:border-gray-600"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Panel
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-gray-100 border border-gray-700 rounded-lg hover:border-gray-600"
                  >
                    <LogOut className="w-4 h-4" />
                    Wyloguj
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm text-gray-300 hover:text-gray-100 border border-gray-700 rounded-lg hover:border-gray-600"
                  >
                    Zarejestruj się
                  </Link>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-700"
                  >
                    Zaloguj się
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Usage Stats Banner */}
      {user && usageStats && !usageStats.isUnlimited && (
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-b border-purple-800/50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-gray-400">Wykorzystane wyszukiwania:</span>
                  <span className="ml-2 font-bold text-white">
                    {usageStats.totalSearches} / {usageStats.totalLimit}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Max wyników:</span>
                  <span className="ml-2 font-bold text-white">{usageStats.maxResults}</span>
                </div>
              </div>
              {usageStats.remainingSearches === 0 && (
                <div className="text-sm text-orange-400 font-medium">
                  ⚠️ Wykorzystano limit bezpłatnych wyszukiwań. Skontaktuj się z administratorem.
                </div>
              )}
              {usageStats.remainingSearches > 0 && usageStats.remainingSearches <= 1 && (
                <div className="text-sm text-yellow-400 font-medium">
                  Pozostało {usageStats.remainingSearches} wyszukiwanie
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {user && usageStats && usageStats.isUnlimited && (
        <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-b border-yellow-800/50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-yellow-400 font-bold">✨ Plan No-Limit</span>
              <span className="text-gray-400">- Nielimitowane wyszukiwania i wyniki</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Form (narrower ~20%) */}
          <div className="lg:col-span-1">
            <ScraperForm
              onScrape={handleScrape}
              loading={loading}
              maxResults={usageStats?.maxResults || 10}
              onModeChange={(mode) => {
                console.log('HomePage received mode change:', mode);
                setCurrentMode(mode);
              }}
            />
          </div>

          {/* Right Column - Results (wider ~80%) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-red-950 border border-red-800 rounded-lg p-4">
                <p className="text-red-400 text-sm whitespace-pre-line">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <TikTokLoader message="Audyt danych TikTok..." />
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
              <>
                {/* Profile Audit - Only for profile mode */}
                {currentMode === 'profile' && profileAuditData && (
                  <ProfileAudit
                    data={profileAuditData}
                    profileName={profileName || 'Profil'}
                  />
                )}

                {/* Show different tables based on mode */}
                {currentMode === 'video' ? (
                  // Comments Table for video mode
                  <>
                    {/* Video Audit Loading/Error - above comments table */}
                    {videoAuditLoading && (
                      <div id="video-audit-section">
                        <TikTokLoader message="Analizowanie komentarzy..." />
                      </div>
                    )}

                    {videoAuditError && (
                      <div id="video-audit-section" className="bg-red-950 border border-red-800 rounded-lg p-4">
                        <p className="text-red-400 text-sm">{videoAuditError}</p>
                      </div>
                    )}

                    {/* Comments table with audit data - only pass auditData after loading completes */}
                    <CommentsTable
                      comments={results as any}
                      auditData={!videoAuditLoading ? videoAuditData?.auditData : undefined}
                      videoUrl={!videoAuditLoading ? videoAuditData?.videoUrl : undefined}
                      videoThumbnail={!videoAuditLoading ? videoAuditData?.videoThumbnail : undefined}
                    />
                  </>
                ) : (
                  // Standard Results Table for other modes
                  <>
                    <AnalyticsCharts results={results} onBarClick={handleVideoHighlight} />
                    <ResultsTable
                      results={results}
                      jobId={jobId}
                      highlightedVideoId={highlightedVideoId}
                      onVideoHighlight={handleVideoHighlight}
                    />
                  </>
                )}

              </>
            )}

            {/* Empty State */}
            {!loading && !error && results.length === 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
                <img src="/tokacademy_logo_rozowe.png" alt="TokAcademy" className="w-20 h-20 mx-auto mb-4 opacity-50 object-cover rounded-lg" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Brak wyników</h3>
                <p className="text-gray-500">Wypełnij formularz i kliknij "Rozpocznij Audyt" aby rozpocząć</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
