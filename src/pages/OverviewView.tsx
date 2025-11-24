import { useEffect, useState } from 'react';
import { getOverview } from '../lib/api';
import { BarChart3, Activity } from 'lucide-react';

interface DailyMetric {
  day: string;
  runs: number;
  usd: number;
}

interface ModeMetric {
  mode: string;
  runs: number;
  usd: number;
}

export function OverviewView() {
  const [dailyData, setDailyData] = useState<DailyMetric[]>([]);
  const [modeData, setModeData] = useState<ModeMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { daily, byMode } = await getOverview(60);
        setDailyData(daily);
        setModeData(byMode);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-700 border-t-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950 border border-red-800 rounded-lg p-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const totalRuns = modeData.reduce((sum, item) => sum + item.runs, 0);
  const totalUsd = modeData.reduce((sum, item) => sum + item.usd, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Przegląd</h2>
        <p className="text-gray-400">Analityka użytkowania za ostatnie 60 dni</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-pink-400" />
            <span className="text-sm text-gray-400">Całkowita liczba uruchomień</span>
          </div>
          <p className="text-3xl font-bold text-gray-100">{totalRuns}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-400">Całkowity koszt</span>
          </div>
          <p className="text-3xl font-bold text-gray-100">${totalUsd.toFixed(4)}</p>
        </div>
      </div>

      {/* Daily Chart - Simple SVG Bar Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Dzienny koszt (USD)</h3>
        <div className="h-[300px] flex items-end justify-around gap-2 px-4">
          {dailyData.length === 0 ? (
            <div className="flex items-center justify-center w-full h-full">
              <p className="text-gray-500">Brak danych do wyświetlenia</p>
            </div>
          ) : (
            dailyData.slice(0, 30).reverse().map((item, index) => {
              const maxUsd = Math.max(...dailyData.map(d => d.usd));
              const height = maxUsd > 0 ? (item.usd / maxUsd) * 250 : 0;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative">
                  <div
                    className="w-full bg-gradient-to-t from-pink-500 to-purple-600 rounded-t hover:from-pink-400 hover:to-purple-500 transition-all"
                    style={{ height: `${height}px`, minHeight: item.usd > 0 ? '2px' : '0' }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      <div>${item.usd.toFixed(4)}</div>
                      <div className="text-gray-400">{item.day}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="mt-4 flex justify-between text-xs text-gray-500">
          <span>Ostatnie 30 dni</span>
          <span>Koszt w USD</span>
        </div>
      </div>

      {/* Mode Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Podsumowanie według trybu</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tryb</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Uruchomienia</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Koszt (USD)</th>
              </tr>
            </thead>
            <tbody>
              {modeData.map((item, index) => (
                <tr key={index} className="border-b border-gray-800 last:border-0">
                  <td className="py-3 px-4 text-sm text-gray-300 capitalize">{item.mode || 'Nieznany'}</td>
                  <td className="py-3 px-4 text-sm text-gray-300 text-right">{item.runs}</td>
                  <td className="py-3 px-4 text-sm text-gray-300 text-right">${item.usd.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
