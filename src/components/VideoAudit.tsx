import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Video,
  TrendingUp,
  MessageCircle,
  Share2,
  Heart,
  Bookmark,
  Eye,
  Clock,
  Users,
  AlertTriangle,
  Lightbulb,
  Target,
  MessageSquare
} from 'lucide-react';

interface VideoAuditData {
  video_summary: string;
  performance_text: string;
  format_insights_text: string;
  cta_effectiveness_text: string;
  cta_examples_suggestions: string[];
  comment_engagement_text: string;
  audience_questions: string[];
  product_feedback: string[];
  content_ideas_from_comments: string[];
  controversies_and_risks: string[];
}

interface VideoMetrics {
  views: number;
  likes: number;
  comments_count: number;
  shares: number;
  saves: number;
  engagement_rate: number;
  total_comments_analyzed: number;
  comments_with_replies_pct: number;
  author_replies_pct: number;
  duration_seconds?: number;
}

interface VideoAuditProps {
  videoUrl: string;
  videoCaption: string;
  authorUsername: string;
  metrics: VideoMetrics;
  auditData: VideoAuditData;
  loading?: boolean;
}

export function VideoAudit({
  videoUrl,
  videoCaption,
  authorUsername,
  metrics,
  auditData,
  loading = false
}: VideoAuditProps) {
  const [expanded, setExpanded] = useState(false);

  // Safe metrics with defaults for comments-only mode
  const safeMetrics: VideoMetrics = {
    views: metrics?.views ?? 0,
    likes: metrics?.likes ?? 0,
    comments_count: metrics?.comments_count ?? 0,
    shares: metrics?.shares ?? 0,
    saves: metrics?.saves ?? 0,
    engagement_rate: metrics?.engagement_rate ?? 0,
    total_comments_analyzed: metrics?.total_comments_analyzed ?? 0,
    comments_with_replies_pct: metrics?.comments_with_replies_pct ?? 0,
    author_replies_pct: metrics?.author_replies_pct ?? 0,
    duration_seconds: metrics?.duration_seconds,
  };

  // Safe data with defaults
  const safeData: VideoAuditData = {
    video_summary: auditData?.video_summary || '',
    performance_text: auditData?.performance_text || '',
    format_insights_text: auditData?.format_insights_text || '',
    cta_effectiveness_text: auditData?.cta_effectiveness_text || '',
    cta_examples_suggestions: Array.isArray(auditData?.cta_examples_suggestions)
      ? auditData.cta_examples_suggestions
      : [],
    comment_engagement_text: auditData?.comment_engagement_text || '',
    audience_questions: Array.isArray(auditData?.audience_questions)
      ? auditData.audience_questions
      : [],
    product_feedback: Array.isArray(auditData?.product_feedback)
      ? auditData.product_feedback
      : [],
    content_ideas_from_comments: Array.isArray(auditData?.content_ideas_from_comments)
      ? auditData.content_ideas_from_comments
      : [],
    controversies_and_risks: Array.isArray(auditData?.controversies_and_risks)
      ? auditData.controversies_and_risks
      : [],
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getEngagementColor = (rate: number) => {
    if (rate >= 15) return 'text-green-400';
    if (rate >= 10) return 'text-yellow-400';
    if (rate >= 5) return 'text-orange-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-700 border-t-pink-500"></div>
          <p className="text-gray-300">Analizowanie komentarzy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      {/* Header - Always Visible */}
      <div
        className="p-6 cursor-pointer hover:bg-gray-850 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Audyt Wideo</h3>
                <p className="text-sm text-gray-400">@{authorUsername}</p>
              </div>
            </div>

            {/* Video Caption Preview */}
            <p className="text-sm text-gray-300 line-clamp-2 mb-3">
              {videoCaption || 'Brak opisu'}
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <div className="bg-gray-800 rounded-lg p-2">
                <div className="flex items-center gap-1 text-blue-400 mb-1">
                  <Eye className="w-3 h-3" />
                  <span className="text-xs">Wyświetlenia</span>
                </div>
                <p className="text-sm font-bold text-white">{formatNumber(safeMetrics.views)}</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-2">
                <div className="flex items-center gap-1 text-pink-400 mb-1">
                  <Heart className="w-3 h-3" />
                  <span className="text-xs">Polubienia</span>
                </div>
                <p className="text-sm font-bold text-white">{formatNumber(safeMetrics.likes)}</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-2">
                <div className="flex items-center gap-1 text-green-400 mb-1">
                  <MessageCircle className="w-3 h-3" />
                  <span className="text-xs">Komentarze</span>
                </div>
                <p className="text-sm font-bold text-white">{formatNumber(safeMetrics.comments_count)}</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-2">
                <div className="flex items-center gap-1 text-purple-400 mb-1">
                  <Share2 className="w-3 h-3" />
                  <span className="text-xs">Udostępnienia</span>
                </div>
                <p className="text-sm font-bold text-white">{formatNumber(safeMetrics.shares)}</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-2">
                <div className="flex items-center gap-1 text-yellow-400 mb-1">
                  <Bookmark className="w-3 h-3" />
                  <span className="text-xs">Zapisy</span>
                </div>
                <p className="text-sm font-bold text-white">{formatNumber(safeMetrics.saves)}</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-2">
                <div className="flex items-center gap-1 text-orange-400 mb-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs">ER</span>
                </div>
                <p className={`text-sm font-bold ${getEngagementColor(safeMetrics.engagement_rate)}`}>
                  {safeMetrics.engagement_rate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <button
            className="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
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

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-800 p-6 space-y-6">
          {/* Video Summary */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-400" />
              Podsumowanie Wideo
            </h4>
            {safeData.video_summary ? (
              <p className="text-gray-300 leading-relaxed">{safeData.video_summary}</p>
            ) : (
              <p className="text-gray-500">Brak podsumowania</p>
            )}
          </div>

          {/* Performance */}
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Wydajność vs Profil
            </h4>
            {safeData.performance_text ? (
              <p className="text-purple-100 leading-relaxed">{safeData.performance_text}</p>
            ) : (
              <p className="text-purple-300/70">Brak danych o wydajności</p>
            )}
          </div>

          {/* Format Insights */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Analiza Formatu
            </h4>
            {safeData.format_insights_text ? (
              <p className="text-gray-300 leading-relaxed">{safeData.format_insights_text}</p>
            ) : (
              <p className="text-gray-500">Brak analizy formatu</p>
            )}
          </div>

          {/* CTA Section */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Skuteczność CTA
            </h4>

            {safeData.cta_effectiveness_text ? (
              <p className="text-gray-300 leading-relaxed mb-4">{safeData.cta_effectiveness_text}</p>
            ) : (
              <p className="text-gray-500 mb-4">Brak analizy CTA</p>
            )}

            {safeData.cta_examples_suggestions.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-semibold text-yellow-300 mb-2">💡 Przykłady CTA do przetestowania:</h5>
                <ul className="space-y-2">
                  {safeData.cta_examples_suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-yellow-400 mt-1">•</span>
                      <span className="italic">"{suggestion}"</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Comments Engagement */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Jakość Dyskusji w Komentarzach
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-900 rounded p-3">
                <p className="text-xs text-gray-400 mb-1">Komentarzy przeanalizowano</p>
                <p className="text-xl font-bold text-green-400">{safeMetrics.total_comments_analyzed}</p>
              </div>

              <div className="bg-gray-900 rounded p-3">
                <p className="text-xs text-gray-400 mb-1">Komentarze z odpowiedziami</p>
                <p className="text-xl font-bold text-blue-400">{safeMetrics.comments_with_replies_pct.toFixed(0)}%</p>
              </div>

              <div className="bg-gray-900 rounded p-3">
                <p className="text-xs text-gray-400 mb-1">Odpowiedzi autora</p>
                <p className="text-xl font-bold text-purple-400">{safeMetrics.author_replies_pct.toFixed(0)}%</p>
              </div>
            </div>

            {safeData.comment_engagement_text ? (
              <p className="text-gray-300 leading-relaxed">{safeData.comment_engagement_text}</p>
            ) : (
              <p className="text-gray-500">Brak analizy jakości dyskusji</p>
            )}
          </div>

          {/* Audience Questions */}
          {safeData.audience_questions.length > 0 && (
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Najczęstsze Pytania Widzów
              </h4>
              <ul className="space-y-2">
                {safeData.audience_questions.map((question, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-blue-200">
                    <span className="text-blue-400 mt-1">❓</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Product Feedback */}
          {safeData.product_feedback.length > 0 && (
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Feedback Produktowy / Oferty
              </h4>
              <ul className="space-y-2">
                {safeData.product_feedback.map((feedback, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-green-200">
                    <span className="text-green-400 mt-1">💬</span>
                    <span>{feedback}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Content Ideas */}
          {safeData.content_ideas_from_comments.length > 0 && (
            <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Pomysły na Kolejne Filmy
              </h4>
              <ul className="space-y-2">
                {safeData.content_ideas_from_comments.map((idea, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-purple-200">
                    <span className="text-purple-400 mt-1">💡</span>
                    <span>{idea}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Controversies and Risks */}
          {safeData.controversies_and_risks.length > 0 && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Kontrowersje i Ryzyka
              </h4>
              <ul className="space-y-2">
                {safeData.controversies_and_risks.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-red-200">
                    <span className="text-red-400 mt-1">⚠️</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Video Link */}
          <div className="pt-4 border-t border-gray-700">
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors"
            >
              <Video className="w-4 h-4" />
              Zobacz wideo na TikTok
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
