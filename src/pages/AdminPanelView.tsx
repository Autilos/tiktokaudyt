import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Users, FileCheck, TrendingUp, Calendar, User as UserIcon } from 'lucide-react';

interface UserStats {
  user_id: string;
  email: string;
  created_at: string;
  total_audits: number;
  recent_audits: {
    id: string;
    created_at: string;
    profile_username: string;
    profile_score: number;
  }[];
}

export function AdminPanelView() {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalAudits, setTotalAudits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkAdminAndFetch();
    }
  }, [user]);

  const checkAdminAndFetch = async () => {
    try {
      setLoading(true);

      // Check if user is admin
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      if (userError) throw userError;

      if (userData?.role !== 'admin') {
        setError('Brak uprawnień administratora');
        setLoading(false);
        return;
      }

      // Fetch all users
      const { data: appUsers, error: usersError } = await supabase
        .from('app_users')
        .select('user_id, email, created_at')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      setTotalUsers(appUsers?.length || 0);

      // Fetch audits count
      const { count: auditsCount, error: auditsCountError } = await supabase
        .from('profile_audits')
        .select('*', { count: 'exact', head: true });

      if (auditsCountError) throw auditsCountError;
      setTotalAudits(auditsCount || 0);

      // Fetch audits for each user
      const usersWithStats = await Promise.all(
        (appUsers || []).map(async (appUser) => {
          const { data: audits, error: auditsError } = await supabase
            .from('profile_audits')
            .select('id, created_at, profile_username, audit_data')
            .eq('user_id', appUser.user_id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (auditsError) {
            console.error('Error fetching audits for user:', auditsError);
            return {
              ...appUser,
              total_audits: 0,
              recent_audits: []
            };
          }

          return {
            ...appUser,
            total_audits: audits?.length || 0,
            recent_audits: (audits || []).map(audit => ({
              id: audit.id,
              created_at: audit.created_at,
              profile_username: audit.profile_username,
              profile_score: audit.audit_data?.profile_score || 0
            }))
          };
        })
      );

      setUsers(usersWithStats);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-pink-500 mb-4"></div>
          <p className="text-gray-400">Ładowanie panelu administratora...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <header className="border-b border-gray-800 bg-gray-900">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <Link to="/" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-2xl font-bold text-white">Panel Administratora</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-950 border border-red-800 rounded-lg p-8 text-center">
            <p className="text-red-400 text-lg">{error}</p>
            <Link
              to="/"
              className="inline-block mt-4 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
            >
              Wróć do strony głównej
            </Link>
          </div>
        </main>
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
              <Link to="/" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Panel Administratora</h1>
                <p className="text-sm text-gray-400">Zarządzanie użytkownikami i audytami</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Admin</p>
              <p className="text-sm font-medium text-white">{user?.email}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-purple-400" />
              <span className="text-3xl font-bold text-white">{totalUsers}</span>
            </div>
            <p className="text-sm text-gray-300">Liczba użytkowników</p>
          </div>

          <div className="bg-gradient-to-br from-green-900/50 to-teal-900/50 border border-green-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <FileCheck className="w-8 h-8 text-green-400" />
              <span className="text-3xl font-bold text-white">{totalAudits}</span>
            </div>
            <p className="text-sm text-gray-300">Wszystkie audyty</p>
          </div>

          <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 border border-orange-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-orange-400" />
              <span className="text-3xl font-bold text-white">
                {totalUsers > 0 ? (totalAudits / totalUsers).toFixed(1) : '0'}
              </span>
            </div>
            <p className="text-sm text-gray-300">Średnia audytów/użytkownik</p>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Lista użytkowników</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Użytkownik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Data rejestracji
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Liczba audytów
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ostatnie audyty
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((userData) => (
                  <tr key={userData.user_id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-600/20 rounded-lg">
                          <UserIcon className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{userData.email}</p>
                          <p className="text-xs text-gray-500">{userData.user_id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        {formatDate(userData.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-purple-600/20 text-purple-400 text-sm font-medium rounded-full">
                        {userData.total_audits} audytów
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {userData.recent_audits.length > 0 ? (
                        <div className="space-y-1">
                          {userData.recent_audits.slice(0, 3).map((audit) => (
                            <div key={audit.id} className="text-xs text-gray-400">
                              @{audit.profile_username} ({audit.profile_score.toFixed(1)}/10) - {formatDate(audit.created_at)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Brak audytów</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
