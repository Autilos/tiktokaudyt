import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, TrendingUp, DollarSign, Activity, Search, Filter, Edit, Trash2, CreditCard, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface User {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
}

interface UserSubscription extends User {
  subscription_plan?: string;
  subscription_status?: string;
  limit_events?: number;
  price_pln?: number;
}

interface PlatformStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalRuns: number;
  totalEventsProcessed: number;
  totalProfileAuditCost: number;
  totalVideoAuditCost: number;
  totalAuditCost: number;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserSubscription[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalRuns: 0,
    totalEventsProcessed: 0,
    totalProfileAuditCost: 0,
    totalVideoAuditCost: 0,
    totalAuditCost: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  useEffect(() => {
    checkAdminAccess();
    loadPlatformData();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('app_users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      navigate('/');
      return;
    }
  };

  const loadPlatformData = async () => {
    setLoading(true);
    try {
      // Load all users with subscriptions
      const { data: usersData } = await supabase
        .from('app_users')
        .select(`
          user_id,
          email,
          role,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (usersData) {
        // Enrich with subscription data
        const enrichedUsers = await Promise.all(
          usersData.map(async (user) => {
            const { data: sub } = await supabase
              .from('subscriptions')
              .select('plan, status, limit_events, price_pln')
              .eq('user_id', user.user_id)
              .eq('status', 'active')
              .order('starts_at', { ascending: false })
              .maybeSingle();

            return {
              ...user,
              subscription_plan: sub?.plan || 'free',
              subscription_status: sub?.status || 'inactive',
              limit_events: sub?.limit_events || 30,
              price_pln: sub?.price_pln || 0
            };
          })
        );

        setUsers(enrichedUsers);

        // Calculate platform statistics
        const totalUsers = usersData.length;
        const activeSubscriptions = enrichedUsers.filter(u =>
          u.subscription_status === 'active' && u.subscription_plan !== 'free'
        ).length;
        const totalRevenue = enrichedUsers.reduce((sum, u) =>
          sum + (u.price_pln || 0), 0
        );

        // Get runs statistics
        const { data: runsData } = await supabase
          .from('runs')
          .select('items_count')
          .not('user_id', 'is', null);

        const totalRuns = runsData?.length || 0;
        const totalEventsProcessed = runsData?.reduce((sum, r) =>
          sum + (r.items_count || 0), 0
        ) || 0;

        // Get audit costs (admin only)
        const { data: profileAuditsData } = await supabase
          .from('profile_audits')
          .select('cost_pln');

        const { data: videoAuditsData } = await supabase
          .from('video_audits')
          .select('cost_pln');

        const totalProfileAuditCost = profileAuditsData?.reduce((sum, a) =>
          sum + (a.cost_pln || 0), 0
        ) || 0;

        const totalVideoAuditCost = videoAuditsData?.reduce((sum, a) =>
          sum + (a.cost_pln || 0), 0
        ) || 0;

        const totalAuditCost = totalProfileAuditCost + totalVideoAuditCost;

        setStats({
          totalUsers,
          activeSubscriptions,
          totalRevenue,
          totalRuns,
          totalEventsProcessed,
          totalProfileAuditCost,
          totalVideoAuditCost,
          totalAuditCost
        });
      }
    } catch (error) {
      console.error('Failed to load platform data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh users list
      loadPlatformData();
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('Nie udało się zaktualizować roli użytkownika');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć użytkownika ${email}?`)) {
      return;
    }

    try {
      // Delete from app_users (cascade will handle subscriptions, runs, etc.)
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh users list
      loadPlatformData();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Nie udało się usunąć użytkownika');
    }
  };

  const handleGrantUnlimited = async () => {
    const email = prompt('Podaj adres email użytkownika, któremu chcesz przyznać nielimitowany dostęp:');
    if (!email) return;

    const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!targetUser) {
      alert('Nie znaleziono użytkownika o podanym adresie email.');
      return;
    }

    if (!confirm(`Czy na pewno chcesz przyznać nielimitowany dostęp dla użytkownika ${targetUser.email}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: targetUser.user_id,
          plan: 'unlimited',
          status: 'active',
          limit_events: 1000000,
          price_pln: 0,
          starts_at: new Date().toISOString(),
          renews_at: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString() // 100 years
        });

      if (error) throw error;

      alert(`Przyznano nielimitowany dostęp dla ${targetUser.email}`);
      loadPlatformData();
    } catch (error: any) {
      console.error('Failed to grant unlimited access:', error);
      alert('Wystąpił błąd: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesPlan = planFilter === 'all' || user.subscription_plan === planFilter;
    return matchesSearch && matchesRole && matchesPlan;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-pink-500 mb-4"></div>
          <p className="text-gray-400">Ładowanie danych administracyjnych...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold mb-2">Panel Administratora</h1>
              <p className="text-gray-400">Zarządzanie użytkownikami i statystyki platformy</p>
            </div>
            <button
              onClick={handleGrantUnlimited}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-pink-900/20"
            >
              <CreditCard className="w-4 h-4" />
              Przyznaj No-Limit
            </button>
          </div>
        </div>

        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <p className="text-sm text-gray-400">Użytkownicy</p>
            </div>
            <p className="text-2xl font-bold text-gray-100">{stats.totalUsers}</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <p className="text-sm text-gray-400">Aktywne Subskrypcje</p>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.activeSubscriptions}</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <p className="text-sm text-gray-400">Przychody (PLN)</p>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{stats.totalRevenue.toFixed(2)}</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <p className="text-sm text-gray-400">Uruchomienia</p>
            </div>
            <p className="text-2xl font-bold text-purple-400">{stats.totalRuns}</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-pink-400" />
              <p className="text-sm text-gray-400">Przetworzonych Eventów</p>
            </div>
            <p className="text-2xl font-bold text-pink-400">{stats.totalEventsProcessed}</p>
          </div>
        </div>

        {/* Audit Costs Statistics (Admin Only) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border border-orange-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-orange-400" />
              <p className="text-sm text-gray-400">Koszt Audytów Profili</p>
            </div>
            <p className="text-2xl font-bold text-orange-400">{stats.totalProfileAuditCost.toFixed(2)} PLN</p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Video className="w-5 h-5 text-purple-400" />
              <p className="text-sm text-gray-400">Koszt Audytów Wideo</p>
            </div>
            <p className="text-2xl font-bold text-purple-400">{stats.totalVideoAuditCost.toFixed(2)} PLN</p>
          </div>

          <div className="bg-gradient-to-br from-red-900/30 to-pink-900/30 border border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-red-400" />
              <p className="text-sm text-gray-400">Łączny Koszt Audytów</p>
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.totalAuditCost.toFixed(2)} PLN</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Szukaj użytkownika po email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="all">Wszystkie Role</option>
                  <option value="user">Użytkownik</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="all">Wszystkie Plany</option>
                <option value="free">Darmowy</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="unlimited">No-Limit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold">Użytkownicy ({filteredUsers.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-850 border-b border-gray-800">
                <tr>
                  <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase">Email</th>
                  <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase">Rola</th>
                  <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase">Plan</th>
                  <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase">Limit</th>
                  <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase">Cena (PLN)</th>
                  <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase">Data Utworzenia</th>
                  <th className="text-center p-4 text-xs font-medium text-gray-400 uppercase">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-850 transition-colors">
                    <td className="p-4">
                      <span className="text-sm text-gray-300">{user.email}</span>
                    </td>
                    <td className="p-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                        className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-pink-500"
                      >
                        <option value="user">Użytkownik</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${user.subscription_plan === 'pro' ? 'bg-purple-900 text-purple-300' :
                        user.subscription_plan === 'starter' ? 'bg-blue-900 text-blue-300' :
                          user.subscription_plan === 'unlimited' ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white' :
                            'bg-gray-800 text-gray-400'
                        }`}>
                        {user.subscription_plan === 'pro' ? 'Pro' :
                          user.subscription_plan === 'starter' ? 'Starter' :
                            user.subscription_plan === 'unlimited' ? 'No-Limit' :
                              'Darmowy'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm text-gray-300">{user.limit_events}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm text-gray-300">{user.price_pln?.toFixed(2) || '0.00'}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-400">{formatDate(user.created_at)}</span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteUser(user.user_id, user.email)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-950 rounded transition-colors"
                        disabled={user.role === 'admin'}
                      >
                        <Trash2 className="w-3 h-3" />
                        Usuń
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
