import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar, User, TrendingUp, ExternalLink } from 'lucide-react';

interface ProfileAudit {
  id: string;
  created_at: string;
  profile_username: string;
  profile_followers: number;
  audit_data: {
    profile_score: number;
    summary: string;
    strengths: string[];
    mistakes: string[];
    video_ideas: string[];
    hashtag_feedback_text: string;
    tiktok_shop_tips_text: string;
    top_hashtags?: string[];
    // AUDYT 2.0 - new fields
    format_insights_text?: string;
    cta_analysis_text?: string;
    seo_analysis_text?: string;
    content_niche_alignment_text?: string;
    content_mix_recommendations?: string;
  };
  videos_analyzed: number;
}

export function UserAuditsView() {
  const [audits, setAudits] = useState<ProfileAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<ProfileAudit | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAudits();
    }
  }, [user]);

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profile_audits')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAudits(data || []);
    } catch (err: any) {
      console.error('Error fetching audits:', err);
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    if (score >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-pink-500 mb-4"></div>
          <p className="text-gray-400">Ładowanie audytów...</p>
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
                <h1 className="text-2xl font-bold text-white">Moje Audyty Profili</h1>
                <p className="text-sm text-gray-400">Historia wykonanych analiz</p>
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
            <User className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Brak audytów</h3>
            <p className="text-gray-500 mb-6">Wykonaj pierwszy audyt profilu, aby zobaczyć historię</p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-700"
            >
              Wykonaj audyt
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
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">@{audit.profile_username}</h3>
                      <p className="text-sm text-gray-400">
                        {audit.profile_followers?.toLocaleString()} obserwujących
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(audit.audit_data.profile_score)}`}>
                      {audit.audit_data.profile_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400">/ 10</div>
                  </div>
                </div>

                {/* Audit Summary */}
                <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                  {audit.audit_data.summary}
                </p>

                {/* Audit Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{audit.videos_analyzed} filmów</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(audit.created_at)}</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Mocne strony</p>
                    <p className="text-sm font-medium text-green-400">{audit.audit_data.strengths.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Do poprawy</p>
                    <p className="text-sm font-medium text-red-400">{audit.audit_data.mistakes.length}</p>
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
                    <h2 className="text-2xl font-bold text-white">@{selectedAudit.profile_username}</h2>
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
                {/* Score */}
                <div className="text-center py-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-800 rounded-lg">
                  <div className={`text-5xl font-bold ${getScoreColor(selectedAudit.audit_data.profile_score)}`}>
                    {selectedAudit.audit_data.profile_score.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">Ocena profilu / 10</div>
                </div>

                {/* Summary */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Podsumowanie</h3>
                  <p className="text-gray-300">{selectedAudit.audit_data.summary}</p>
                </div>

                {/* Strengths & Mistakes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                    <h4 className="font-semibold text-green-400 mb-3">💪 Mocne strony</h4>
                    <ul className="space-y-2">
                      {selectedAudit.audit_data.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-green-200 flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                    <h4 className="font-semibold text-red-400 mb-3">⚠️ Do poprawy</h4>
                    <ul className="space-y-2">
                      {selectedAudit.audit_data.mistakes.map((mistake, idx) => (
                        <li key={idx} className="text-sm text-red-200 flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span>{mistake}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Video Ideas */}
                {selectedAudit.audit_data.video_ideas.length > 0 && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-400 mb-3">🎬 Pomysły na filmy</h4>
                    <ul className="space-y-2">
                      {selectedAudit.audit_data.video_ideas.map((idea, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-yellow-400 mt-1">•</span>
                          <span>{idea}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Hashtag Feedback */}
                {selectedAudit.audit_data.hashtag_feedback_text && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-400 mb-3">🏷️ Rekomendacje hashtagów</h4>
                    <p className="text-sm text-gray-300 whitespace-pre-line">
                      {selectedAudit.audit_data.hashtag_feedback_text}
                    </p>
                  </div>
                )}

                {/* TikTok Shop Tips */}
                {selectedAudit.audit_data.tiktok_shop_tips_text && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-green-400 mb-3">🛒 TikTok Shop</h4>
                    <p className="text-sm text-gray-300 whitespace-pre-line">
                      {selectedAudit.audit_data.tiktok_shop_tips_text}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
