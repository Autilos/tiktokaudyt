import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, HelpCircle, Users, Lightbulb, AlertTriangle } from 'lucide-react';

// Types matching backend structure (using string for flexibility with LLM responses)
export interface AudienceQuestion {
  question: string;
  question_type: string;
  representative_comments: string[];
  business_priority: string;
  suggested_answer_points: string[];
}

export interface ProductFeedback {
  summary: string;
  positive_points: string[];
  negative_points: string[];
  price_perception: string;
  quality_perception: string;
  key_quotes: string[];
}

export interface ContentIdea {
  idea_title: string;
  idea_type: string;
  based_on_comments: string[];
  short_description: string;
  cta_suggestion: string;
}

export interface ControversiesAndRisks {
  has_controversy: boolean;
  main_topics: string[];
  risk_level: string;
  description: string;
  example_comments: string[];
  recommendations: string[];
}

export interface SummaryForUI {
  sentiment?: string;
  summaryText?: string;
  topQuestionsCount?: number;
  contentIdeasCount?: number;
  hasControversy?: boolean;
  riskLevel?: string;
  positivePointsCount?: number;
  negativePointsCount?: number;
}

interface CommentsInsightsProps {
  summary?: string;
  sentiment?: string;
  audience_questions?: AudienceQuestion[];
  product_feedback?: ProductFeedback;
  content_ideas_from_comments?: ContentIdea[];
  controversies_and_risks?: ControversiesAndRisks;
  summaryForUI?: SummaryForUI;
  videoUrl?: string;
  videoThumbnail?: string;
  commentsCount?: number;
}

export function CommentsInsights({
  summary,
  sentiment,
  audience_questions = [],
  product_feedback,
  content_ideas_from_comments = [],
  controversies_and_risks,
  summaryForUI,
  videoUrl,
  videoThumbnail,
  commentsCount
}: CommentsInsightsProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'feedback' | 'ideas' | 'risks'>('overview');

  const hasAnyInsights =
    audience_questions.length > 0 ||
    product_feedback ||
    content_ideas_from_comments.length > 0 ||
    controversies_and_risks?.has_controversy ||
    summary;

  if (!hasAnyInsights) {
    return null;
  }

  // Calculate counts from data or use summaryForUI
  const topQuestionsCount = summaryForUI?.topQuestionsCount ?? audience_questions.length;
  const contentIdeasCount = summaryForUI?.contentIdeasCount ?? content_ideas_from_comments.length;
  const positivePointsCount = summaryForUI?.positivePointsCount ?? (product_feedback?.positive_points?.length ?? 0);
  const negativePointsCount = summaryForUI?.negativePointsCount ?? (product_feedback?.negative_points?.length ?? 0);
  const hasControversy = summaryForUI?.hasControversy ?? controversies_and_risks?.has_controversy;
  const riskLevel = summaryForUI?.riskLevel ?? controversies_and_risks?.risk_level ?? 'niski';
  const displaySentiment = summaryForUI?.sentiment ?? sentiment ?? 'neutral';
  const displaySummary = summaryForUI?.summaryText ?? summary;

  const getSentimentLabel = (s: string) => {
    switch (s) {
      case 'positive': return 'Pozytywny';
      case 'negative': return 'Negatywny';
      case 'mixed': return 'Mieszany';
      default: return 'Neutralny';
    }
  };

  const getSentimentColor = (s: string) => {
    switch (s) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      case 'mixed': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-800 rounded-lg overflow-hidden">
      {/* Header - Click to expand */}
      <div
        className="p-4 sm:p-6 cursor-pointer hover:bg-purple-900/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Mobile Layout */}
        <div className="sm:hidden space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-lg">💬</span>
                <h2 className="text-base font-bold text-white">ANALIZA KOMENTARZY</h2>
                <span className="text-lg">🔍</span>
              </div>
              <p className="text-xs text-purple-300">
                {topQuestionsCount} pytań • {contentIdeasCount} pomysłów
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-purple-900/30 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className={`text-lg font-bold ${getSentimentColor(displaySentiment)}`}>
                  {getSentimentLabel(displaySentiment)}
                </div>
                <div className="text-xs text-purple-300">Sentyment</div>
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
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💬</span>
                <h2 className="text-xl font-bold text-white">ANALIZA KOMENTARZY</h2>
                <span className="text-2xl">🔍</span>
              </div>
              <p className="text-sm text-purple-300 mt-1">
                {topQuestionsCount} pytań widzów • {contentIdeasCount} pomysłów na content • +{positivePointsCount}/-{negativePointsCount} feedback
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getSentimentColor(displaySentiment)}`}>
                {getSentimentLabel(displaySentiment)}
              </div>
              <div className="text-xs text-purple-300">Sentyment</div>
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

      {/* Expanded Content with Tabs */}
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
              <span className="text-lg">📋</span>
              <span>Przegląd</span>
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'questions'
                  ? 'bg-purple-800 text-white border-b-2 border-purple-400'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              <span className="text-lg">❓</span>
              <span>Pytania ({topQuestionsCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'feedback'
                  ? 'bg-purple-800 text-white border-b-2 border-purple-400'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              <span className="text-lg">📊</span>
              <span>Feedback</span>
            </button>
            <button
              onClick={() => setActiveTab('ideas')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'ideas'
                  ? 'bg-purple-800 text-white border-b-2 border-purple-400'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              <span className="text-lg">💡</span>
              <span>Pomysły ({contentIdeasCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('risks')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'risks'
                  ? 'bg-purple-800 text-white border-b-2 border-purple-400'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
              }`}
            >
              <span className="text-lg">⚠️</span>
              <span>Ryzyka</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Analyzed Video Info */}
                {videoUrl && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      {/* Video Thumbnail */}
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 group"
                      >
                        <div className="w-24 h-32 bg-gray-700 rounded-lg overflow-hidden relative">
                          {videoThumbnail ? (
                            <img
                              src={videoThumbnail}
                              alt="Miniatura filmu"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-900/50 to-purple-900/50">
                              <span className="text-3xl">🎬</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl">▶</span>
                          </div>
                        </div>
                      </a>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">🎬</span>
                          <h3 className="text-base font-semibold text-white">Analizowany film</h3>
                        </div>
                        <a
                          href={videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-pink-700 hover:bg-pink-800 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <span>▶</span>
                          <span>Otwórz na TikTok</span>
                        </a>
                        <p className="mt-3 text-xs text-gray-400">
                          📊 Analiza oparta na {commentsCount || 0} komentarzach
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary */}
                {displaySummary && (
                  <div className="bg-purple-900/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">📋</span>
                      <h3 className="text-lg font-semibold text-white">Podsumowanie</h3>
                    </div>
                    <p className="text-purple-200 leading-relaxed">{displaySummary}</p>
                  </div>
                )}

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 text-center">
                    <HelpCircle className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-400">{topQuestionsCount}</div>
                    <div className="text-sm text-blue-300">Pytań widzów</div>
                  </div>

                  <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 text-center">
                    <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-400">+{positivePointsCount}/-{negativePointsCount}</div>
                    <div className="text-sm text-green-300">Feedback</div>
                  </div>

                  <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4 text-center">
                    <Lightbulb className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-400">{contentIdeasCount}</div>
                    <div className="text-sm text-purple-300">Pomysłów</div>
                  </div>

                  <div className={`rounded-lg p-4 text-center ${hasControversy ? 'bg-red-900/20 border border-red-800' : 'bg-green-900/20 border border-green-800'}`}>
                    <AlertTriangle className={`w-8 h-8 mx-auto mb-2 ${hasControversy ? 'text-red-400' : 'text-green-400'}`} />
                    <div className={`text-2xl font-bold ${hasControversy ? 'text-red-400' : 'text-green-400'}`}>
                      {hasControversy ? riskLevel : 'OK'}
                    </div>
                    <div className={`text-sm ${hasControversy ? 'text-red-300' : 'text-green-300'}`}>Ryzyko</div>
                  </div>
                </div>
              </div>
            )}

            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <div className="space-y-4">
                {audience_questions.length === 0 ? (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center">
                    <HelpCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-gray-400 mb-2">Brak pytań</h4>
                    <p className="text-gray-500">Nie znaleziono wyraźnych pytań w komentarzach.</p>
                  </div>
                ) : (
                  audience_questions.map((q, idx) => (
                    <div key={idx} className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xl">❓</span>
                          <h4 className="font-semibold text-blue-300">{q.question}</h4>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                          q.business_priority === 'wysoki' ? 'bg-red-900/50 text-red-300' :
                          q.business_priority === 'sredni' ? 'bg-yellow-900/50 text-yellow-300' :
                          'bg-gray-800 text-gray-300'
                        }`}>
                          {q.business_priority}
                        </span>
                      </div>
                      {q.suggested_answer_points?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-blue-400 mb-2">💡 Sugerowane punkty odpowiedzi:</p>
                          <ul className="space-y-1">
                            {q.suggested_answer_points.map((point, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-blue-200">
                                <span className="text-blue-400 mt-1">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <div className="space-y-6">
                {product_feedback?.summary && (
                  <div className="bg-purple-900/30 rounded-lg p-4">
                    <p className="text-purple-200">{product_feedback.summary}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Positive Points */}
                  <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">💪</span>
                      <h4 className="font-semibold text-green-400">Co działa</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-green-200">
                      {product_feedback?.positive_points?.length ? (
                        product_feedback.positive_points.map((point, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-green-300/70">Brak danych</li>
                      )}
                    </ul>
                  </div>

                  {/* Negative Points */}
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">⚠️</span>
                      <h4 className="font-semibold text-red-400">Co boli</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-red-200">
                      {product_feedback?.negative_points?.length ? (
                        product_feedback.negative_points.map((point, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-red-400 mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-red-300/70">Brak danych</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Price & Quality Perception */}
                {(product_feedback?.price_perception || product_feedback?.quality_perception) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product_feedback?.price_perception && (
                      <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">💰</span>
                          <h4 className="font-semibold text-yellow-400">Percepcja ceny</h4>
                        </div>
                        <p className="text-yellow-200 text-sm">{product_feedback.price_perception}</p>
                      </div>
                    )}
                    {product_feedback?.quality_perception && (
                      <div className="bg-indigo-900/20 border border-indigo-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">⭐</span>
                          <h4 className="font-semibold text-indigo-400">Percepcja jakości</h4>
                        </div>
                        <p className="text-indigo-200 text-sm">{product_feedback.quality_perception}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Ideas Tab */}
            {activeTab === 'ideas' && (
              <div className="space-y-4">
                {content_ideas_from_comments.length === 0 ? (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center">
                    <Lightbulb className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-gray-400 mb-2">Brak pomysłów</h4>
                    <p className="text-gray-500">Nie znaleziono wyraźnych tematów na nowe treści w komentarzach.</p>
                  </div>
                ) : (
                  content_ideas_from_comments.map((idea, idx) => (
                    <div key={idx} className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🎬</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-yellow-400 mb-2">{idea.idea_title}</h4>
                          <p className="text-yellow-200 text-sm mb-2">{idea.short_description}</p>
                          {idea.cta_suggestion && (
                            <p className="text-sm text-yellow-300/70">
                              <span className="font-medium">CTA:</span> <span className="italic">"{idea.cta_suggestion}"</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Risks Tab */}
            {activeTab === 'risks' && (
              <div className="space-y-4">
                {!hasControversy ? (
                  <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 text-center">
                    <AlertTriangle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-green-400 mb-2">Brak kontrowersji</h4>
                    <p className="text-green-300">Komentarze nie wskazują na istotne ryzyka reputacyjne ani produktowe.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                        <h4 className="font-semibold text-red-400">Poziom ryzyka: {riskLevel}</h4>
                      </div>
                      {controversies_and_risks?.description && (
                        <p className="text-red-200 mb-4">{controversies_and_risks.description}</p>
                      )}

                      {controversies_and_risks?.main_topics && controversies_and_risks.main_topics.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-red-300 mb-2">Główne tematy:</p>
                          <div className="flex flex-wrap gap-2">
                            {controversies_and_risks.main_topics.map((topic, i) => (
                              <span key={i} className="px-3 py-1 bg-red-800/50 text-red-200 rounded-full text-sm">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {controversies_and_risks?.recommendations && controversies_and_risks.recommendations.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-red-800/50">
                          <p className="text-sm font-medium text-green-400 mb-2">💡 Rekomendacje:</p>
                          <ul className="space-y-2">
                            {controversies_and_risks.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-green-300">
                                <span className="text-green-400 mt-1">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
