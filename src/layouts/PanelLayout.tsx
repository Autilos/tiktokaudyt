import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, CreditCard, BarChart3, History, LogOut, Shield, ArrowLeft } from 'lucide-react';

export function PanelLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('app_users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    setIsAdmin(data?.role === 'admin');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/panel/plan', icon: CreditCard, label: 'Plan i użytkowanie' },
    { path: '/panel/overview', icon: BarChart3, label: 'Przegląd' },
    { path: '/panel/runs', icon: History, label: 'Historia uruchomień' },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3">
                <img src="/tokacademy_logo_rozowe.png" alt="TokAcademy" className="w-9 h-9 object-cover rounded-lg" />
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                    TikTok Audyt
                  </h1>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-yellow-500/10 to-orange-600/10 text-yellow-400 border border-yellow-500/20 rounded-lg hover:border-yellow-500/40 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}
              <span className="text-sm text-gray-400">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-gray-100 border border-gray-700 rounded-lg hover:border-gray-600"
              >
                <LogOut className="w-4 h-4" />
                Wyloguj się
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-800">
                <LayoutDashboard className="w-5 h-5 text-pink-400" />
                <h2 className="text-sm font-semibold text-gray-100">Panel administratora</h2>
              </div>
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-gradient-to-r from-pink-500/10 to-purple-600/10 text-pink-400 border border-pink-500/20'
                          : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {isAdmin && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm bg-gradient-to-r from-yellow-500/10 to-orange-600/10 text-yellow-400 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    Panel Administratora
                  </Link>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-800">
                <Link
                  to="/"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Powrót do Audytu
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
