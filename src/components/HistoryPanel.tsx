import { useState, useEffect } from 'react';
import { Clock, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HistoryPanelProps {
  onLoadHistory: (items: any[]) => void;
}

interface HistoryItem {
  id: string;
  mode: string;
  inputs: string[];
  count: number;
  timestamp: string;
}

export function HistoryPanel({ onLoadHistory }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    // Load history from localStorage
    const recentScrapes = JSON.parse(localStorage.getItem('recentScrapes') || '[]');
    setHistory(recentScrapes);
  }, []);

  const handleLoadHistory = async (jobId: string) => {
    setLoading(jobId);
    try {
      // Fetch results from database
      const { data, error } = await supabase
        .from('scraping_results')
        .select('*')
        .eq('job_id', jobId);

      if (error) {
        console.error('Error loading history:', error);
        return;
      }

      // Convert database results to the format expected by the app
      const formattedResults = (data || []).map(item => ({
        id: item.video_id,
        text: item.text,
        author: {
          uniqueId: item.author_name,
          id: item.author_id
        },
        stats: {
          playCount: item.play_count,
          diggCount: item.digg_count,
          commentCount: item.comment_count,
          shareCount: item.share_count
        },
        shareUrl: item.share_url,
        covers: {
          default: item.thumbnail_url
        }
      }));

      onLoadHistory(formattedResults);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(null);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min temu`;
    } else if (diffHours < 24) {
      return `${diffHours} godz. temu`;
    } else if (diffDays < 7) {
      return `${diffDays} dni temu`;
    } else {
      return date.toLocaleDateString('pl-PL');
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'hashtag':
        return 'Hashtag';
      case 'profile':
        return 'Profil';
      case 'search':
        return 'Szukaj';
      case 'video':
        return 'Wideo';
      default:
        return mode;
    }
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-gray-100">Ostatnie Audyty</h3>
      </div>

      <div className="space-y-3">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => handleLoadHistory(item.id)}
            disabled={loading === item.id}
            className="w-full text-left p-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-purple-400 uppercase">
                    {getModeLabel(item.mode)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.count} wyników
                  </span>
                </div>
                <p className="text-sm text-gray-300 truncate">
                  {item.inputs.join(', ')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(item.timestamp)}
                </p>
              </div>
              {loading === item.id && (
                <Loader className="w-4 h-4 text-purple-400 animate-spin flex-shrink-0" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
