import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../utils/api';
import { Users, Car, Calendar, TrendingUp, DollarSign, AlertCircle, CheckCircle, Clock, FileText, Wallet, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminStats {
  total_users: number;
  active_users: number;
  total_vehicles: number;
  pending_vehicles: number;
  total_bookings: number;
  active_bookings: number;
  total_revenue: number;
  total_commission?: number;
  pending_payouts?: number;
  released_payouts?: number;
  pending_payout_count?: number;
  users_growth?: number;
  bookings_growth?: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== 'admin') {
      navigate('/');
      return;
    }

    if (user?.role === 'admin') {
      loadStats();
    }
  }, [user, navigate]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'blue',
      link: '/admin/users',
    },
    {
      title: 'Active Users',
      value: stats?.active_users || 0,
      icon: CheckCircle,
      color: 'green',
      link: '/admin/users?status=ACTIVE',
    },
    {
      title: 'Total Vehicles',
      value: stats?.total_vehicles || 0,
      icon: Car,
      color: 'purple',
      link: '/admin/vehicles',
    },
    {
      title: 'Pending Vehicles',
      value: stats?.pending_vehicles || 0,
      icon: AlertCircle,
      color: 'yellow',
      link: '/admin/vehicles?verification_status=PENDING',
    },
    {
      title: 'Total Bookings',
      value: stats?.total_bookings || 0,
      icon: Calendar,
      color: 'indigo',
      link: '/admin/bookings',
    },
    {
      title: 'Active Bookings',
      value: stats?.active_bookings || 0,
      icon: Clock,
      color: 'orange',
      link: '/admin/bookings?status=PENDING,CONFIRMED',
    },
    {
      title: 'Total Revenue',
      value: `₫${(stats?.total_revenue || 0).toLocaleString('vi-VN')}`,
      icon: DollarSign,
      color: 'emerald',
      link: '/admin/payments',
    },
    {
      title: 'Total Commission',
      value: `₫${(stats?.total_commission || 0).toLocaleString('vi-VN')}`,
      icon: TrendingUp,
      color: 'rose',
      subtitle: '10% of revenue',
    },
    {
      title: 'Pending Payouts',
      value: `₫${(stats?.pending_payouts || 0).toLocaleString('vi-VN')}`,
      icon: Wallet,
      color: 'amber',
      link: '/admin/payouts',
      badge: stats?.pending_payout_count || 0,
    },
    {
      title: 'Released Payouts',
      value: `₫${(stats?.released_payouts || 0).toLocaleString('vi-VN')}`,
      icon: CreditCard,
      color: 'teal',
      subtitle: 'Paid to hosts',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Overview of your platform statistics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            const colorClasses = {
              blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
              green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
              purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
              yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400',
              indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400',
              orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400',
              emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
              rose: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400',
              amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
              teal: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400',
            };

            return (
              <div
                key={index}
                onClick={() => card.link && navigate(card.link)}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 ${colorClasses[card.color as keyof typeof colorClasses]} cursor-pointer hover:shadow-xl transition-all`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.title}
                  </h3>
                  {card.badge !== undefined && card.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                      {card.badge}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {card.subtitle}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6">
          <div
            onClick={() => navigate('/admin/users')}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-rose-500 dark:hover:border-rose-500 cursor-pointer transition-all"
          >
            <Users className="w-8 h-8 text-rose-600 dark:text-rose-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Manage Users
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              View, edit, and manage user accounts
            </p>
          </div>

          <div
            onClick={() => navigate('/admin/vehicles')}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-rose-500 dark:hover:border-rose-500 cursor-pointer transition-all"
          >
            <Car className="w-8 h-8 text-rose-600 dark:text-rose-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Approve Vehicles
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Review and verify vehicle listings
            </p>
          </div>

          <div
            onClick={() => navigate('/admin/bookings')}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-rose-500 dark:hover:border-rose-500 cursor-pointer transition-all"
          >
            <Calendar className="w-8 h-8 text-rose-600 dark:text-rose-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Manage Bookings
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all bookings
            </p>
          </div>

          <div
            onClick={() => navigate('/admin/kyc')}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-rose-500 dark:hover:border-rose-500 cursor-pointer transition-all"
          >
            <FileText className="w-8 h-8 text-rose-600 dark:text-rose-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              KYC Verification
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Review and verify user identity documents
            </p>
          </div>

          <div
            onClick={() => navigate('/admin/payouts')}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-rose-500 dark:hover:border-rose-500 cursor-pointer transition-all"
          >
            <Wallet className="w-8 h-8 text-rose-600 dark:text-rose-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Manage Payouts
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Release payouts to vehicle hosts
            </p>
            {stats?.pending_payout_count && stats.pending_payout_count > 0 && (
              <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                {stats.pending_payout_count} pending
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

