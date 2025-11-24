import { useEffect, useState } from 'react';
import { getRuns } from '../lib/api';
import { History, Filter } from 'lucide-react';

interface Run {
  id: string;
  created_at: string;
  mode: string;
  status: string;
  items_count: number;
  cu_used: number;
  usd_used: number;
  dataset_id: string;
}

export function RunsView() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadRuns = async (from?: string, to?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRuns(from, to);
      setRuns(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleFilter = () => {
    loadRuns(fromDate || undefined, toDate || undefined);
  };

  const totalUsd = runs.reduce((sum, run) => sum + (run.usd_used || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Historia uruchomień</h2>
        <p className="text-gray-400">Przeglądaj szczegóły wszystkich uruchomień</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-300">Filtry</h3>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-400 mb-2">Od</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-400 mb-2">Do</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <button
            onClick={handleFilter}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-pink-600 hover:to-purple-700"
          >
            Filtruj
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Całkowity koszt w wybranym okresie:</span>
          <span className="text-lg font-bold text-gray-100">${totalUsd.toFixed(4)}</span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-700 border-t-pink-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-950 border border-red-800 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Runs Table */}
      {!loading && !error && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Data</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Tryb</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-400">Wyniki</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-400">CU</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-400">USD</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">ID</th>
                </tr>
              </thead>
              <tbody>
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      <History className="w-12 h-12 mx-auto mb-2 text-gray-700" />
                      <p>Brak uruchomień</p>
                    </td>
                  </tr>
                ) : (
                  runs.map((run) => (
                    <tr key={run.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                      <td className="py-3 px-4 text-xs text-gray-300">
                        {new Date(run.created_at).toLocaleString('pl-PL')}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-300 capitalize">
                        {run.mode || 'Nieznany'}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs ${
                            run.status === 'SUCCEEDED'
                              ? 'bg-green-950 text-green-400'
                              : run.status === 'FAILED'
                              ? 'bg-red-950 text-red-400'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-300 text-right">
                        {run.items_count || 0}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-300 text-right">
                        {run.cu_used?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-300 text-right">
                        ${run.usd_used?.toFixed(4) || '0.0000'}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400 font-mono">
                        {run.id.slice(0, 8)}...
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
