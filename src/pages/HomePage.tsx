import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ScraperForm } from '../components/ScraperForm';
import { ResultsTable } from '../components/ResultsTable';
import { CommentsTable } from '../components/CommentsTable';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import { ProfileAudit } from '../components/ProfileAudit';
import { TikTokLoader } from '../components/TikTokLoader';
import { secureFetch, checkClientRateLimit, logSecurityEvent, getCsrfToken } from '../lib/security';
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
  const { user, signOut } = useAuth();

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
        'Authorization': `Bearer ${session?.access_token || anonKey}`,
        'apikey': anonKey
      };

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

      try {
        response = await fetch('/api/tiktok-scraper', {
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

            // Use refreshSession to ensure we have a valid token
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            let session = refreshData?.session;

            console.log('📊 Session refresh:', {
              hasSession: !!session,
              hasAccessToken: !!session?.access_token,
              tokenExpiry: session?.expires_at,
              refreshError: refreshError?.message
            });

            if (!session) {
              // Fallback to getSession if refresh fails
              const { data: { session: fallbackSession } } = await supabase.auth.getSession();
              if (!fallbackSession) {
                throw new Error('Brak sesji użytkownika. Zaloguj się ponownie.');
              }
              session = fallbackSession;
            }

            const analyzerUrl = '/api/video-analyzer';
            console.log('📊 Calling video-analyzer at:', analyzerUrl);
            console.log('📊 Token preview:', session.access_token?.substring(0, 50) + '...');
            console.log('📊 Token length:', session.access_token?.length);

            const analyzerResponse = await fetch(
              analyzerUrl,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
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

            setVideoAuditData({
              videoUrl: videoUrl,
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Form (narrower ~20%) */}
          <div className="lg:col-span-1">
            <ScraperForm
              onScrape={handleScrape}
              loading={loading}
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
                  // Results in video mode are comments, cast to any to avoid type mismatch
                  <CommentsTable
                    comments={results as any}
                    auditData={videoAuditData?.auditData}
                  />
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

                {/* Video Audit Section */}
                {videoAuditError && (
                  <div id="video-audit-section" className="bg-red-950 border border-red-800 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{videoAuditError}</p>
                  </div>
                )}

                {videoAuditLoading && (
                  <div id="video-audit-section">
                    <TikTokLoader message="Analizowanie wideo..." />
                  </div>
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
