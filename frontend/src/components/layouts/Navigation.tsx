import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Settings, User, LogOut, Rocket, Link as LinkIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../stores/authStore';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { UTMBuilder } from '../tools/UTMBuilder';

export function Navigation() {
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const [activeLaunchCount, setActiveLaunchCount] = useState<number>(0);
  const [showUTMBuilder, setShowUTMBuilder] = useState(false);

  useEffect(() => {
    // Fetch active launch count
    const fetchActiveLaunches = async () => {
      try {
        const response = await api.get('/launches', {
          params: { status: 'active', limit: 100 },
        });
        setActiveLaunchCount(response.data.launches?.length || 0);
      } catch (error) {
        // Silently fail - badge just won't show
        console.error('Failed to fetch active launches:', error);
      }
    };

    fetchActiveLaunches();
    // Refresh every 5 minutes
    const interval = setInterval(fetchActiveLaunches, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: BarChart3,
    },
    {
      path: '/launches',
      label: 'Launches',
      icon: Rocket,
      badge: activeLaunchCount,
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
    },
    {
      path: '/account',
      label: 'Account',
      icon: User,
    },
  ];

  const isActive = (path: string) => {
    if (path === '/launches') {
      return location.pathname.startsWith('/launches');
    }
    return location.pathname === path;
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">CourseSignal</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-normal relative',
                    isActive(item.path)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                  {/* Active launch badge */}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-success-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Build Link Button */}
            <button
              onClick={() => setShowUTMBuilder(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors duration-normal shadow-sm"
              title="Build tracking link"
            >
              <LinkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Build Link</span>
            </button>

            {/* User Menu */}
            <div className="ml-4 pl-4 border-l border-gray-200 flex items-center gap-3">
              {user && (
                <span className="text-sm text-gray-700 hidden md:inline">
                  {user.email}
                </span>
              )}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-normal"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* UTM Builder Drawer */}
      <UTMBuilder
        isOpen={showUTMBuilder}
        onClose={() => setShowUTMBuilder(false)}
      />
    </nav>
  );
}
