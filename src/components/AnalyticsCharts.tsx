import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface AnalyticsChartsProps {
  results: any[];
  onBarClick?: (videoId: string | null) => void;
}

export function AnalyticsCharts({ results, onBarClick }: AnalyticsChartsProps) {
  // Get top 10 videos by likes
  const topVideos = [...results]
    .sort((a, b) => {
      const likesA = a.diggCount || a.stats?.diggCount || 0;
      const likesB = b.diggCount || b.stats?.diggCount || 0;
      return likesB - likesA;
    })
    .slice(0, 10)
    .map((item, index) => {
      // Extract title from text (first line or first 50 chars)
      const text = item.text || '';
      // Remove hashtags from title - split by # and take only the first part
      const textWithoutHashtags = text.split('#')[0].trim();
      const firstLine = textWithoutHashtags.split('\n')[0];
      const title = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;

      return {
        name: title || `Wideo ${index + 1}`,
        videoId: item.id || item.videoId,
        author: item.authorMeta?.name || item.author?.uniqueId || 'Nieznany',
        likes: item.diggCount || item.stats?.diggCount || 0,
        views: item.playCount || item.stats?.playCount || 0,
      };
    });

  // Calculate engagement distribution from ALL results
  const totalLikes = results.reduce((sum, item) => sum + (item.diggCount || item.stats?.diggCount || 0), 0);
  const totalComments = results.reduce((sum, item) => sum + (item.commentCount || item.stats?.commentCount || 0), 0);
  const totalShares = results.reduce((sum, item) => sum + (item.shareCount || item.stats?.shareCount || 0), 0);
  const totalViews = results.reduce((sum, item) => sum + (item.playCount || item.stats?.playCount || 0), 0);

  const engagementData = [
    { name: 'Lubię to', value: totalLikes, color: '#ec4899' },
    { name: 'Komentarze', value: totalComments, color: '#10b981' },
    { name: 'Udostępnienia', value: totalShares, color: '#a855f7' },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Custom tooltip with video title
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm font-medium mb-2">
            📽️ {data.name}
          </p>
          <p className="text-pink-400 text-sm">
            ❤️ {formatNumber(payload[0].value)} polubień
          </p>
          <p className="text-blue-400 text-sm">
            👁️ {formatNumber(data.views)} wyświetleń
          </p>
          <p className="text-gray-500 text-xs mt-1">
            @{data.author}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (data: any) => {
    if (onBarClick) {
      onBarClick(data.videoId);
    }
  };

  // Custom label renderer for pie chart with smaller font
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="11px"
        fontWeight="500"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Type assertions for Recharts components
  const RechartsBarChart = BarChart as any;
  const RechartsBar = Bar as any;
  const RechartsXAxis = XAxis as any;
  const RechartsYAxis = YAxis as any;
  const RechartsCartesianGrid = CartesianGrid as any;
  const RechartsTooltip = Tooltip as any;
  const RechartsResponsiveContainer = ResponsiveContainer as any;
  const RechartsPieChart = PieChart as any;
  const RechartsPie = Pie as any;
  const RechartsCell = Cell as any;
  const RechartsLegend = Legend as any;

  return (
    <div className="space-y-6">
      {/* Mobile: Horizontal slider for charts */}
      <div className="lg:hidden">
        <p className="text-xs text-gray-400 mb-2 px-1">👉 Przesuń w bok aby zobaczyć więcej</p>
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Top Videos Chart - Mobile */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 min-w-[85vw] snap-center flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-pink-400" />
              <h3 className="text-base font-semibold text-gray-100">Top 10 Filmów</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">Top 10 z {results.length} filmów</p>
            <RechartsResponsiveContainer width="100%" height={250}>
              <RechartsBarChart data={topVideos}>
                <RechartsCartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <RechartsXAxis dataKey="name" stroke="#9ca3af" fontSize={10} tick={false} />
                <RechartsYAxis stroke="#9ca3af" fontSize={10} tickFormatter={formatNumber} />
                <RechartsTooltip content={<CustomTooltip />} />
                <RechartsBar
                  dataKey="likes"
                  fill="#ec4899"
                  radius={[8, 8, 0, 0]}
                  onClick={(data) => handleBarClick(data)}
                  cursor="pointer"
                />
              </RechartsBarChart>
            </RechartsResponsiveContainer>
          </div>

          {/* Engagement Distribution - Mobile */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 min-w-[85vw] snap-center flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-semibold text-gray-100">Rozkład Zaangażowania</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">Dla {results.length} filmów</p>
            <RechartsResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <RechartsPie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {engagementData.map((entry, index) => (
                    <RechartsCell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </RechartsPie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                  formatter={(value: any) => formatNumber(value)}
                />
                <RechartsLegend
                  wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }}
                  formatter={(value: any) => <span style={{ color: '#9ca3af' }}>{value}</span>}
                />
              </RechartsPieChart>
            </RechartsResponsiveContainer>
          </div>

          {/* Summary Statistics - Mobile */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 min-w-[85vw] snap-center flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📊</span>
              <h3 className="text-base font-semibold text-gray-100">Statystyki</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Filmy</p>
                <p className="text-xl font-bold text-gray-100">{results.length}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Polubienia</p>
                <p className="text-xl font-bold text-pink-400">{formatNumber(totalLikes)}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Wyświetlenia</p>
                <p className="text-xl font-bold text-blue-400">{formatNumber(totalViews)}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Komentarze</p>
                <p className="text-xl font-bold text-green-400">{formatNumber(totalComments)}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 col-span-2">
                <p className="text-xs text-gray-400 mb-1">Udostępnienia</p>
                <p className="text-xl font-bold text-purple-400">{formatNumber(totalShares)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Original grid layout */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-6">
        {/* Top Videos Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-pink-400" />
            <h3 className="text-lg font-semibold text-gray-100">Top 10 Filmów według Polubień</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">Pokazuje 10 najpopularniejszych filmów z {results.length} znalezionych</p>
          <RechartsResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={topVideos}>
              <RechartsCartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <RechartsXAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <RechartsYAxis stroke="#9ca3af" fontSize={12} tickFormatter={formatNumber} />
              <RechartsTooltip content={<CustomTooltip />} />
              <RechartsBar
                dataKey="likes"
                fill="#ec4899"
                radius={[8, 8, 0, 0]}
                onClick={(data) => handleBarClick(data)}
                cursor="pointer"
              />
            </RechartsBarChart>
          </RechartsResponsiveContainer>
          <p className="text-xs text-gray-400 mt-3 text-center">
            💡 Kliknij aby podglądnąć tytuł filmu
          </p>
        </div>

        {/* Engagement Distribution */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-100">Rozkład Zaangażowania</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">Proporcje dla wszystkich {results.length} {results.length === 1 ? 'filmu' : 'filmów'}</p>
          <RechartsResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <RechartsPie
                data={engagementData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {engagementData.map((entry, index) => (
                  <RechartsCell key={`cell-${index}`} fill={entry.color} />
                ))}
              </RechartsPie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6'
                }}
                formatter={(value: any) => formatNumber(value)}
              />
              <RechartsLegend
                wrapperStyle={{ color: '#9ca3af' }}
                formatter={(value: any) => <span style={{ color: '#9ca3af' }}>{value}</span>}
              />
            </RechartsPieChart>
          </RechartsResponsiveContainer>
        </div>

        {/* Summary Statistics */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-400 mb-2">
              📊 Statystyki podsumowujące dla wszystkich {results.length} {results.length === 1 ? 'filmu' : 'filmów'} w wynikach
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Wszystkie Filmy</p>
              <p className="text-2xl font-bold text-gray-100">{results.length}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Polubienia</p>
              <p className="text-2xl font-bold text-pink-400">{formatNumber(totalLikes)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Wyświetlania</p>
              <p className="text-2xl font-bold text-blue-400">{formatNumber(totalViews)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Komentarze</p>
              <p className="text-2xl font-bold text-green-400">{formatNumber(totalComments)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Wszystkie Udostępnienia</p>
              <p className="text-2xl font-bold text-purple-400">{formatNumber(totalShares)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
