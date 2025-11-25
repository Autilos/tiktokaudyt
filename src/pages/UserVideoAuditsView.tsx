import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserVideoAudits } from '../services';
import {
  ArrowLeft,
  Calendar,
  Video,
  TrendingUp,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle
} from 'lucide-react';

// Component-specific interface that matches actual API response
interface VideoAudit {
  id: string;
  created_at: string;
  video_id?: string;
  video_url: string;
  video_caption?: string;
  author_username?: string;
  views?: number;
  likes?: number;
  comments_count?: number;
  engagement_rate?: number;
  total_comments_analyzed: number;
  audit_data: {
    video_summary?: string;
    performance_text?: string;
    format_insights_text?: string;
    cta_effectiveness_text?: string;
    cta_examples_suggestions?: string[];
    comment_engagement_text?: string;
    audience_questions?: any[];
    product_feedback?: any;
    content_ideas_from_comments?: any[];
    controversies_and_risks?: any;
  };
}

export function UserVideoAuditsView() {
  const [audits, setAudits] = useState<VideoAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<VideoAudit | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAudits();
    }
  }, [user]);

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const { data, error } = await getUserVideoAudits(user!.id);

      if (error) throw error;

      // Cast to component-specific type
      setAudits((data || []) as VideoAudit[]);
    } catch (err: any) {
      console.error('Error fetching video audits:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-pink-500 mb-4"></div>
          <p className="text-gray-400">Ładowanie audytów wideo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Moje Audyty Wideo</h1>
                <p className="text-sm text-gray-400">Historia analizy pojedynczych filmów</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Zalogowany jako</p>
              <p className="text-sm font-medium text-white">{user?.email}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {audits.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <Video className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Brak audytów wideo</h3>
            <p className="text-gray-500 mb-6">Przeanalizuj pierwsze wideo, aby zobaczyć historię</p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-700"
            >
              Przeanalizuj wideo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {audits.map((audit) => (
              <div
                key={audit.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-purple-700 transition-colors cursor-pointer"
                onClick={() => setSelectedAudit(audit)}
              >
                {/* Audit Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">@{audit.author_username || 'Nieznany'}</h3>
                      <p className="text-sm text-gray-400">
                        {audit.total_comments_analyzed ?? 0} komentarzy
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getEngagementColor(audit.engagement_rate ?? 0)}`}>
                      {(audit.engagement_rate ?? 0).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">ER</div>
                  </div>
                </div>

                {/* Video Caption */}
                <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                  {audit.video_caption || 'Brak opisu'}
                </p>

                {/* Video Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-800 rounded p-2">
                    <div className="flex items-center gap-1 text-blue-400 mb-1">
                      <Eye className="w-3 h-3" />
                      <span className="text-xs">Wyświetlenia</span>
                    </div>
                    <p className="text-sm font-bold text-white">{formatNumber(audit.views ?? 0)}</p>
                  </div>

                  <div className="bg-gray-800 rounded p-2">
                    <div className="flex items-center gap-1 text-pink-400 mb-1">
                      <Heart className="w-3 h-3" />
                      <span className="text-xs">Polubienia</span>
                    </div>
                    <p className="text-sm font-bold text-white">{formatNumber(audit.likes ?? 0)}</p>
                  </div>

                  <div className="bg-gray-800 rounded p-2">
                    <div className="flex items-center gap-1 text-green-400 mb-1">
                      <MessageCircle className="w-3 h-3" />
                      <span className="text-xs">Komentarze</span>
                    </div>
                    <p className="text-sm font-bold text-white">{formatNumber(audit.comments_count ?? 0)}</p>
                  </div>
                </div>

                {/* Audit Summary */}
                <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                  {audit.audit_data?.video_summary || 'Brak podsumowania'}
                </p>

                {/* Date */}
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(audit.created_at)}</span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Pytania widzów</p>
                    <p className="text-sm font-medium text-blue-400">
                      {audit.audit_data?.audience_questions?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Pomysły na filmy</p>
                    <p className="text-sm font-medium text-purple-400">
                      {audit.audit_data?.content_ideas_from_comments?.length || 0}
                    </p>
                  </div>
                </div>

                {/* View Details Button */}
                <button
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <span>Zobacz szczegóły</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Audit Detail Modal */}
        {selectedAudit && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedAudit(null)}
          >
            <div
              className="bg-gray-900 border border-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">@{selectedAudit.author_username}</h2>
                    <p className="text-sm text-gray-400">
                      {formatDate(selectedAudit.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedAudit(null)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
                  >
                    Zamknij
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Video Caption */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Opis wideo</h3>
                  <p className="text-gray-300">{selectedAudit.video_caption || 'Brak opisu'}</p>
                </div>

                {/* Engagement Rate */}
                <div className="text-center py-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-800 rounded-lg">
                  <div className={`text-5xl font-bold ${getEngagementColor(selectedAudit.engagement_rate ?? 0)}`}>
                    {(selectedAudit.engagement_rate ?? 0).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400 mt-2">Współczynnik Zaangażowania</div>
                </div>

                {/* Video Summary */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Podsumowanie</h3>
                  <p className="text-gray-300">{selectedAudit.audit_data?.video_summary || 'Brak podsumowania'}</p>
                </div>

                {/* Performance */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-400 mb-2">Wydajność vs Profil</h3>
                  <p className="text-gray-300">{selectedAudit.audit_data?.performance_text || 'Brak danych'}</p>
                </div>

                {/* Format Insights */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">Analiza Formatu</h3>
                  <p className="text-gray-300">{selectedAudit.audit_data?.format_insights_text || 'Brak danych'}</p>
                </div>

                {/* CTA */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">CTA & Skuteczność</h3>
                  <p className="text-gray-300 mb-3">{selectedAudit.audit_data?.cta_effectiveness_text || 'Brak danych'}</p>
                  {selectedAudit.audit_data?.cta_examples_suggestions?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-300 mb-2">Przykłady CTA:</h4>
                      <ul className="space-y-1">
                        {selectedAudit.audit_data.cta_examples_suggestions.map((cta, idx) => (
                          <li key={idx} className="text-sm text-gray-300">
                            <span className="text-yellow-400">•</span> {cta}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Comment Engagement */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">Jakość Dyskusji</h3>
                  <p className="text-gray-300">{selectedAudit.audit_data?.comment_engagement_text || 'Brak danych'}</p>
                </div>

                {/* Audience Questions */}
                {selectedAudit.audit_data?.audience_questions?.length > 0 && (
                  <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-400 mb-3">Pytania Widzów</h4>
                    <ul className="space-y-2">
                      {selectedAudit.audit_data.audience_questions.map((question, idx) => (
                        <li key={idx} className="text-sm text-blue-200 flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{typeof question === 'string' ? question : question?.question || JSON.stringify(question)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Product Feedback */}
                {selectedAudit.audit_data?.product_feedback && (
                  <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                    <h4 className="font-semibold text-green-400 mb-3">Feedback Produktowy</h4>
                    {Array.isArray(selectedAudit.audit_data.product_feedback) ? (
                      <ul className="space-y-2">
                        {selectedAudit.audit_data.product_feedback.map((feedback: any, idx: number) => (
                          <li key={idx} className="text-sm text-green-200 flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            <span>{typeof feedback === 'string' ? feedback : JSON.stringify(feedback)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-green-200">{selectedAudit.audit_data.product_feedback.summary || JSON.stringify(selectedAudit.audit_data.product_feedback)}</p>
                    )}
                  </div>
                )}

                {/* Content Ideas */}
                {selectedAudit.audit_data?.content_ideas_from_comments?.length > 0 && (
                  <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-400 mb-3">Pomysły na Kolejne Filmy</h4>
                    <ul className="space-y-2">
                      {selectedAudit.audit_data.content_ideas_from_comments.map((idea, idx) => (
                        <li key={idx} className="text-sm text-purple-200 flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>{typeof idea === 'string' ? idea : idea?.idea_title || JSON.stringify(idea)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Controversies */}
                {selectedAudit.audit_data?.controversies_and_risks && (
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                    <h4 className="font-semibold text-red-400 mb-3">Kontrowersje i Ryzyka</h4>
                    {Array.isArray(selectedAudit.audit_data.controversies_and_risks) ? (
                      <ul className="space-y-2">
                        {selectedAudit.audit_data.controversies_and_risks.map((risk: any, idx: number) => (
                          <li key={idx} className="text-sm text-red-200 flex items-start gap-2">
                            <span className="text-red-400 mt-1">•</span>
                            <span>{typeof risk === 'string' ? risk : JSON.stringify(risk)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-red-200">{selectedAudit.audit_data.controversies_and_risks.description || JSON.stringify(selectedAudit.audit_data.controversies_and_risks)}</p>
                    )}
                  </div>
                )}

                {/* Video Link */}
                <div className="pt-4 border-t border-gray-700">
                  <a
                    href={selectedAudit.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    Zobacz wideo na TikTok
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
