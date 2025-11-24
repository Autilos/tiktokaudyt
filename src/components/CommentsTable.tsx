import { useState } from 'react';
import { Heart, MessageCircle, User, TrendingUp } from 'lucide-react';
import {
  CommentsInsights,
  AudienceQuestion,
  ProductFeedback,
  ContentIdea,
  ControversiesAndRisks
} from './CommentsInsights';

// Comment interface that matches both TikTok scraper and comments scraper formats
export interface Comment {
  cid: string;
  text: string;
  diggCount: number;
  replyCommentTotal?: number;
  likedByAuthor?: boolean;
  pinnedByAuthor?: boolean;
  uid: string;
  uniqueId: string;
  createTimeISO?: string;
  repliesToId?: string | null;
}

interface AuditData {
  // video-analyzer format
  video_summary?: string;
  comment_engagement_text?: string;
  // Generic format (for compatibility)
  summary?: string;
  sentiment?: string;
  audience_questions?: AudienceQuestion[];
  product_feedback?: ProductFeedback;
  content_ideas_from_comments?: ContentIdea[];
  controversies_and_risks?: ControversiesAndRisks;
}

interface CommentsTableProps {
  comments: Comment[];
  videoUrl?: string;
  auditData?: AuditData;
}

export function CommentsTable({ comments, videoUrl, auditData }: CommentsTableProps) {
  // Debug: log auditData to see what we're receiving
  console.log('📊 CommentsTable auditData:', auditData);
  console.log('📊 Has audience_questions:', auditData?.audience_questions?.length);
  console.log('📊 Has product_feedback:', !!auditData?.product_feedback);
  console.log('📊 Has content_ideas:', auditData?.content_ideas_from_comments?.length);

  const [sortField, setSortField] = useState<'likes' | 'replies' | 'author' | 'date' | null>('likes');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('desc');

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortedComments = () => {
    if (!sortField || !sortDirection) return comments;

    return [...comments].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'likes':
          aValue = a.diggCount || 0;
          bValue = b.diggCount || 0;
          break;
        case 'replies':
          aValue = a.replyCommentTotal || 0;
          bValue = b.replyCommentTotal || 0;
          break;
        case 'author':
          aValue = a.uniqueId?.toLowerCase() || '';
          bValue = b.uniqueId?.toLowerCase() || '';
          break;
        case 'date':
          aValue = a.createTimeISO || '';
          bValue = b.createTimeISO || '';
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const sortedComments = getSortedComments();

  const getSortIcon = (field: typeof sortField) => {
    if (sortField !== field) return '↕️';
    if (sortDirection === 'desc') return '↓';
    if (sortDirection === 'asc') return '↑';
    return '↕️';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate stats
  const totalLikes = comments.reduce((sum, c) => sum + (c.diggCount || 0), 0);
  const totalReplies = comments.reduce((sum, c) => sum + (c.replyCommentTotal || 0), 0);
  const commentsWithReplies = comments.filter(c => (c.replyCommentTotal || 0) > 0).length;
  const authorLiked = comments.filter(c => c.likedByAuthor).length;
  const pinned = comments.filter(c => c.pinnedByAuthor).length;

  return (
    <div className="space-y-4">
      {/* LLM-Generated Insights - at the top */}
      {auditData && (
        <CommentsInsights
          summary={auditData.summary || auditData.video_summary || auditData.comment_engagement_text}
          sentiment={auditData.sentiment}
          audience_questions={auditData.audience_questions || []}
          product_feedback={auditData.product_feedback}
          content_ideas_from_comments={auditData.content_ideas_from_comments || []}
          controversies_and_risks={auditData.controversies_and_risks}
        />
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-blue-300">Komentarze</p>
          </div>
          <p className="text-xl font-bold text-blue-400">{comments.length}</p>
        </div>

        <div className="bg-gradient-to-br from-pink-900/30 to-pink-800/30 border border-pink-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-pink-400" />
            <p className="text-xs text-pink-300">Łącznie polubień</p>
          </div>
          <p className="text-xl font-bold text-pink-400">{formatNumber(totalLikes)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <p className="text-xs text-purple-300">Z odpowiedziami</p>
          </div>
          <p className="text-xl font-bold text-purple-400">
            {commentsWithReplies} ({((commentsWithReplies / comments.length) * 100).toFixed(0)}%)
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-green-400" />
            <p className="text-xs text-green-300">Autor polubił</p>
          </div>
          <p className="text-xl font-bold text-green-400">
            {authorLiked} ({((authorLiked / comments.length) * 100).toFixed(0)}%)
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 border border-yellow-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="w-4 h-4 text-yellow-400" />
            <p className="text-xs text-yellow-300">Przypięte</p>
          </div>
          <p className="text-xl font-bold text-yellow-400">{pinned}</p>
        </div>
      </div>

      {/* Comments Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-300">
                  <button
                    onClick={() => handleSort('author')}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Autor
                    <span className="text-xs">{getSortIcon('author')}</span>
                  </button>
                </th>
                <th className="text-left p-4 text-sm font-medium text-gray-300">
                  Komentarz
                </th>
                <th className="text-center p-4 text-sm font-medium text-gray-300">
                  <button
                    onClick={() => handleSort('likes')}
                    className="flex items-center gap-2 hover:text-white transition-colors mx-auto"
                  >
                    <Heart className="w-4 h-4" />
                    Polubienia
                    <span className="text-xs">{getSortIcon('likes')}</span>
                  </button>
                </th>
                <th className="text-center p-4 text-sm font-medium text-gray-300">
                  <button
                    onClick={() => handleSort('replies')}
                    className="flex items-center gap-2 hover:text-white transition-colors mx-auto"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Odpowiedzi
                    <span className="text-xs">{getSortIcon('replies')}</span>
                  </button>
                </th>
                <th className="text-center p-4 text-sm font-medium text-gray-300">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-2 hover:text-white transition-colors mx-auto"
                  >
                    Data
                    <span className="text-xs">{getSortIcon('date')}</span>
                  </button>
                </th>
                <th className="text-center p-4 text-sm font-medium text-gray-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedComments.map((comment, index) => (
                <tr
                  key={comment.cid || index}
                  className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-300">@{comment.uniqueId}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-300 leading-relaxed">{comment.text}</p>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 text-pink-400 font-medium">
                      <Heart className="w-3 h-3" />
                      {formatNumber(comment.diggCount || 0)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 text-purple-400 font-medium">
                      <MessageCircle className="w-3 h-3" />
                      {comment.replyCommentTotal || 0}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-xs text-gray-400">
                      {formatDate(comment.createTimeISO)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col gap-1 items-center">
                      {comment.pinnedByAuthor && (
                        <span className="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded">
                          📌 Przypięty
                        </span>
                      )}
                      {comment.likedByAuthor && (
                        <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded">
                          ❤️ Autor polubił
                        </span>
                      )}
                      {comment.repliesToId && (
                        <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-400 rounded">
                          💬 Odpowiedź
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {comments.length === 0 && (
          <div className="p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Brak komentarzy do wyświetlenia</p>
          </div>
        )}
      </div>
    </div>
  );
}
