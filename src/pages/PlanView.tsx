import { useEffect, useState } from 'react';
import { getCurrentPlanAndUsage } from '../lib/api';
import { CreditCard, TrendingUp, AlertCircle } from 'lucide-react';

interface PlanData {
  user: any;
  plan: string;
  limit: number;
  price: number;
  usage: {
    events: number;
    usd: number;
  };
}

export function PlanView() {
  const [data, setData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const planData = await getCurrentPlanAndUsage();
        setData(planData);
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

  if (error || !data) {
    return (
      <div className="bg-red-950 border border-red-800 rounded-lg p-4">
        <p className="text-red-400">{error || 'Nie udało się załadować danych'}</p>
      </div>
    );
  }

  const progressPercentage = Math.min((data.usage.events / data.limit) * 100, 100);
  const isNearLimit = progressPercentage >= 80;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Plan i użytkowanie</h2>
        <p className="text-gray-400">Zarządzaj swoim planem i monitoruj zużycie</p>
      </div>

      {/* Current Plan */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-6 h-6 text-pink-400" />
          <h3 className="text-lg font-semibold text-gray-100">Aktualny plan</h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-lg font-medium">
                {data.plan === 'free' ? 'Darmowy' : data.plan === 'starter' ? 'Starter' : 'Pro'}
              </span>
              <span className="text-gray-100 text-xl font-bold">
                {data.price > 0 ? `${data.price} PLN/miesiąc` : 'Bezpłatny'}
              </span>
            </div>
            {data.plan === 'free' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-800 border border-gray-700 rounded-full">
                <span className="text-xs text-gray-400">Darmowy trial: 3 testy × 10 wyników</span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Limit miesięczny</span>
              <span className="text-sm text-gray-300">{data.limit} wydarzeń</span>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-100">Zużycie w tym miesiącu</h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Wydarzenia</span>
              <span className="text-sm text-gray-300">
                {data.usage.events} / {data.limit}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isNearLimit ? 'bg-red-500' : 'bg-gradient-to-r from-pink-500 to-purple-600'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {isNearLimit && (
            <div className="flex items-start gap-2 p-3 bg-orange-950 border border-orange-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-300">Zbliżasz się do limitu</p>
                <p className="text-xs text-orange-400 mt-1">
                  Wykorzystano {progressPercentage.toFixed(0)}% miesięcznego limitu
                </p>
              </div>
            </div>
          )}

          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Koszt w tym miesiącu</span>
              <span className="text-sm text-gray-300">${data.usage.usd.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      {data.plan === 'free' && (
        <div className="bg-gradient-to-r from-pink-950 to-purple-950 border border-pink-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-2">Ulepsz swój plan</h3>
          <p className="text-gray-300 text-sm mb-4">
            Zwiększ limity i uzyskaj dostęp do większej liczby wydarzeń
          </p>
          <button className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-700">
            Zobacz plany
          </button>
        </div>
      )}
    </div>
  );
}
