import { useState } from 'react';
import { ChevronDown, ChevronUp, User, Hash, Lightbulb, DollarSign } from 'lucide-react';

interface ProfileAuditData {
  profile_score: number;
  summary: string;
  strengths: string[];
  mistakes: string[];
  video_ideas: string[];
  hashtag_feedback_text: string;
  tiktok_shop_tips_text: string;
  top_hashtags?: string[];
  // AUDYT 2.0 - new fields
  format_insights_text: string;
  cta_analysis_text: string;
  seo_analysis_text: string;
  content_niche_alignment_text: string;
  content_mix_recommendations: string;
}

interface ProfileAuditProps {
  data: ProfileAuditData;
  profileName: string;
}

export function ProfileAudit({ data, profileName }: ProfileAuditProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'ideas' | 'cta' | 'seo' | 'shop'>('overview');

  // Safe defaults for data - handle null/undefined data
  if (!data) {
    return (
      <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-800 rounded-lg p-6 text-center">
        <p className="text-purple-300">Brak danych audytu profilu</p>
      </div>
    );
  }

  const safeData = {
    profile_score: typeof data?.profile_score === 'number' ? data.profile_score : 0,
    summary: typeof data?.summary === 'string' ? data.summary : 'Brak podsumowania',
    strengths: Array.isArray(data?.strengths) ? data.strengths : [],
    mistakes: Array.isArray(data?.mistakes) ? data.mistakes : [],
    video_ideas: Array.isArray(data?.video_ideas) ? data.video_ideas : [],
    hashtag_feedback_text: typeof data?.hashtag_feedback_text === 'string' ? data.hashtag_feedback_text : '',
    tiktok_shop_tips_text: typeof data?.tiktok_shop_tips_text === 'string' ? data.tiktok_shop_tips_text : '',
    top_hashtags: Array.isArray(data?.top_hashtags) ? data.top_hashtags : [],
    // AUDYT 2.0 - new fields with defaults
    format_insights_text: typeof data?.format_insights_text === 'string' ? data.format_insights_text : '',
    cta_analysis_text: typeof data?.cta_analysis_text === 'string' ? data.cta_analysis_text : '',
    seo_analysis_text: typeof data?.seo_analysis_text === 'string' ? data.seo_analysis_text : '',
    content_niche_alignment_text: typeof data?.content_niche_alignment_text === 'string' ? data.content_niche_alignment_text : '',
    content_mix_recommendations: typeof data?.content_mix_recommendations === 'string' ? data.content_mix_recommendations : ''
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    if (score >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Doskonały';
    if (score >= 6) return 'Dobry';
    if (score >= 4) return 'Średni';
    return 'Wymaga poprawy';
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-800 rounded-lg overflow-hidden">
      {/* Header with Emojis - Mobile optimized */}
      <div
        className="p-4 sm:p-6 cursor-pointer hover:bg-purple-900/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Mobile Layout */}
        <div className="sm:hidden space-y-4">
          {/* Row 1: Title */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-lg">🎯</span>
                <h2 className="text-base font-bold text-white">AUDYT PROFILU</h2>
                <span className="text-lg">📊</span>
              </div>
              <p className="text-xs text-purple-300 truncate">
                {profileName}
              </p>
            </div>
          </div>

          {/* Row 2: Score + Button */}
          <div className="flex items-center justify-between bg-purple-900/30 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(safeData.profile_score)}`}>
                  {safeData.profile_score.toFixed(1)}
                </div>
                <div className="text-xs text-purple-300">/ 10</div>
              </div>
              <div className={`text-sm font-medium ${getScoreColor(safeData.profile_score)}`}>
                {getScoreLabel(safeData.profile_score)}
              </div>
            </div>
            <button
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <>
                  <span>ZWIŃ</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>ROZWIŃ</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <h2 className="text-xl font-bold text-white">AUDYT PROFILU</h2>
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-sm text-purple-300 mt-1">
                Szczegółowa analiza profilu {profileName} • Tylko dla audytu profili
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(safeData.profile_score)}`}>
                {safeData.profile_score.toFixed(1)}
              </div>
              <div className="text-xs text-purple-300">/ 10</div>
            </div>
            <div className="text-center">
              <div className={`text-sm font-medium ${getScoreColor(safeData.profile_score)} mb-1`}>
                {getScoreLabel(safeData.profile_score)}
              </div>
              <button
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
              >
                {expanded ? (
                  <>
                    <span>ZWIŃ</span>
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>ROZWIŃ</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-purple-800">
          {/* Tab Navigation */}
          <div className="flex border-b border-purple-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-purple-800 text-white border-b-2 border-purple-400'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              <span className="text-lg">📈</span>
              <span>Przegląd</span>
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'recommendations'
                  ? 'bg-purple-800 text-white border-b-2 border-purple-400'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              <span className="text-lg">💡</span>
              <span>Rekomendacje</span>
            </button>
            <button
              onClick={() => setActiveTab('ideas')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'ideas'
                  ? 'bg-purple-800 text-white border-b-2 border-purple-400'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              <span className="text-lg">🎬</span>
              <span>Pomysły na filmy</span>
            </button>
            <button
              onClick={() => setActiveTab('cta')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'cta'
                  ? 'bg-purple-800 text-white border-b-2 border-purple-400'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              <span className="text-lg">📣</span>
              <span>CTA & Interakcje</span>
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'seo'
                  ? 'bg-purple-800 text-white border-b-2 border-purple-400'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              <span className="text-lg">🔍</span>
              <span>TikTok SEO</span>
            </button>
            <button
              onClick={() => setActiveTab('shop')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'shop'
                  ? 'bg-purple-800 text-white border-b-2 border-purple-400'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              <span className="text-lg">🛒</span>
              <span>TikTok Shop</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-purple-900/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📋</span>
                    <h3 className="text-lg font-semibold text-white">Podsumowanie</h3>
                  </div>
                  <p className="text-purple-200 leading-relaxed">
                    {safeData.summary.split(/(@\w+)/g).map((part, index) =>
                      part.startsWith('@') ? (
                        <span key={index} className="font-bold text-purple-100">{part}</span>
                      ) : (
                        <span key={index}>{part}</span>
                      )
                    )}
                  </p>
                </div>

                {/* Strengths and Mistakes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">💪</span>
                      <h4 className="font-semibold text-green-400">Mocne strony</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-green-200">
                      {safeData.strengths.length > 0 ? (
                        safeData.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            <span>{strength}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-green-300/70">Brak danych</li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">⚠️</span>
                      <h4 className="font-semibold text-red-400">Do poprawy</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-red-200">
                      {safeData.mistakes.length > 0 ? (
                        safeData.mistakes.map((mistake, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-400 mt-1">•</span>
                            <span>{mistake}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-red-300/70">Brak danych</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                {/* Hashtag Feedback */}
                <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="w-5 h-5 text-purple-400" />
                    <h4 className="font-semibold text-purple-400">Rekomendacje hashtagów</h4>
                    <span className="text-sm text-purple-400">🏷️</span>
                  </div>

                  {/* Top Hashtags Section */}
                  {safeData.top_hashtags && safeData.top_hashtags.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-purple-300 mb-2">Twoje popularne hashtagi:</h5>
                      <div className="flex flex-wrap gap-2">
                        {safeData.top_hashtags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-800/50 text-purple-200 rounded-full text-sm font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback Text */}
                  {safeData.hashtag_feedback_text && safeData.hashtag_feedback_text.trim().length > 0 ? (
                    <div className="text-purple-200 space-y-3 mt-4">
                      <h5 className="text-sm font-semibold text-purple-300 mb-2">Uwagi:</h5>
                      {safeData.hashtag_feedback_text.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="leading-relaxed">{paragraph}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-purple-300/70">Brak rekomendacji dotyczących hashtagów.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'ideas' && (
              <div className="space-y-4">
                {Array.isArray(safeData.video_ideas) && safeData.video_ideas.length > 0 ? (
                  safeData.video_ideas.map((idea, index) => (
                    <div key={index} className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🎬</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-yellow-400 mb-2">
                            Pomysł #{index + 1}
                          </h4>
                          <p className="text-yellow-200 text-sm">{typeof idea === 'string' ? idea : String(idea)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center">
                    <Lightbulb className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-gray-400 mb-2">Brak pomysłów</h4>
                    <p className="text-gray-500">Nie znaleziono pomysłów na filmy.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cta' && (
              <div className="space-y-6">
                <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">📣</span>
                    <h4 className="font-semibold text-orange-400">Analiza CTA i interakcji</h4>
                  </div>
                  {safeData.cta_analysis_text && safeData.cta_analysis_text.trim() ? (
                    <div className="text-orange-200 space-y-3">
                      {safeData.cta_analysis_text.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="leading-relaxed">{paragraph}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-orange-300/70">Brak rekomendacji dotyczących CTA i interakcji.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-6">
                <div className="bg-indigo-900/20 border border-indigo-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🔍</span>
                    <h4 className="font-semibold text-indigo-400">TikTok SEO</h4>
                  </div>
                  {safeData.seo_analysis_text && safeData.seo_analysis_text.trim() ? (
                    <div className="text-indigo-200 space-y-3">
                      {safeData.seo_analysis_text.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="leading-relaxed">{paragraph}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-indigo-300/70">Brak rekomendacji dotyczących TikTok SEO.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'shop' && (
              <div className="space-y-6">
                {safeData.tiktok_shop_tips_text && safeData.tiktok_shop_tips_text.trim() ? (
                  <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <h4 className="font-semibold text-green-400">TikTok Shop - Rekomendacje</h4>
                      <span className="text-sm text-green-400">🛒</span>
                    </div>
                    <p className="text-green-200 whitespace-pre-line">{safeData.tiktok_shop_tips_text}</p>
                  </div>
                ) : (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center">
                    <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-gray-400 mb-2">TikTok Shop nie dotyczy</h4>
                    <p className="text-gray-500">Ten profil nie ma potencjału na TikTok Shop lub nie dotyczy go ta funkcja.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
