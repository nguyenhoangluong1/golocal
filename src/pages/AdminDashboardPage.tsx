import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../utils/api';
import { Users, Car, Calendar, TrendingUp, DollarSign, AlertCircle, CheckCircle, Clock, FileText, Wallet, CreditCard, ChevronDown, ChevronUp, Eye, Edit, ArrowRight, BarChart3, Activity } from 'lucide-react';
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
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

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
      details: {
        active: stats?.active_users || 0,
        inactive: (stats?.total_users || 0) - (stats?.active_users || 0),
        growth: stats?.users_growth || 0,
      },
      description: 'Tổng số người dùng đã đăng ký trên nền tảng',
    },
    {
      title: 'Active Users',
      value: stats?.active_users || 0,
      icon: CheckCircle,
      color: 'green',
      link: '/admin/users?status=ACTIVE',
      details: {
        percentage: stats?.total_users ? Math.round((stats.active_users / stats.total_users) * 100) : 0,
        growth: stats?.users_growth || 0,
      },
      description: 'Số người dùng đang hoạt động trong hệ thống',
    },
    {
      title: 'Total Vehicles',
      value: stats?.total_vehicles || 0,
      icon: Car,
      color: 'purple',
      link: '/admin/vehicles',
      details: {
        verified: (stats?.total_vehicles || 0) - (stats?.pending_vehicles || 0),
        pending: stats?.pending_vehicles || 0,
      },
      description: 'Tổng số phương tiện đã được đăng ký',
    },
    {
      title: 'Pending Vehicles',
      value: stats?.pending_vehicles || 0,
      icon: AlertCircle,
      color: 'yellow',
      link: '/admin/vehicles?verification_status=PENDING',
      details: {
        needsReview: stats?.pending_vehicles || 0,
        percentage: stats?.total_vehicles ? Math.round((stats.pending_vehicles / stats.total_vehicles) * 100) : 0,
      },
      description: 'Số phương tiện đang chờ xét duyệt',
    },
    {
      title: 'Total Bookings',
      value: stats?.total_bookings || 0,
      icon: Calendar,
      color: 'indigo',
      link: '/admin/bookings',
      details: {
        active: stats?.active_bookings || 0,
        completed: (stats?.total_bookings || 0) - (stats?.active_bookings || 0),
        growth: stats?.bookings_growth || 0,
      },
      description: 'Tổng số đặt chỗ đã được tạo',
    },
    {
      title: 'Active Bookings',
      value: stats?.active_bookings || 0,
      icon: Clock,
      color: 'orange',
      link: '/admin/bookings?status=PENDING,CONFIRMED',
      details: {
        pending: Math.floor((stats?.active_bookings || 0) * 0.3),
        confirmed: Math.floor((stats?.active_bookings || 0) * 0.7),
      },
      description: 'Số đặt chỗ đang trong quá trình xử lý',
    },
    {
      title: 'Total Revenue',
      value: `₫${(stats?.total_revenue || 0).toLocaleString('vi-VN')}`,
      icon: DollarSign,
      color: 'emerald',
      link: '/admin/payments',
      details: {
        commission: stats?.total_commission || 0,
        netRevenue: (stats?.total_revenue || 0) - (stats?.total_commission || 0),
      },
      description: 'Tổng doanh thu từ tất cả các đặt chỗ',
    },
    {
      title: 'Total Commission',
      value: `₫${(stats?.total_commission || 0).toLocaleString('vi-VN')}`,
      icon: TrendingUp,
      color: 'rose',
      subtitle: '10% of revenue',
      details: {
        percentage: 10,
        revenue: stats?.total_revenue || 0,
      },
      description: 'Tổng hoa hồng thu được (10% doanh thu)',
    },
    {
      title: 'Pending Payouts',
      value: `₫${(stats?.pending_payouts || 0).toLocaleString('vi-VN')}`,
      icon: Wallet,
      color: 'amber',
      link: '/admin/payouts',
      badge: stats?.pending_payout_count || 0,
      details: {
        count: stats?.pending_payout_count || 0,
        average: stats?.pending_payout_count ? Math.round((stats.pending_payouts || 0) / stats.pending_payout_count) : 0,
      },
      description: 'Số tiền đang chờ thanh toán cho chủ xe',
    },
    {
      title: 'Released Payouts',
      value: `₫${(stats?.released_payouts || 0).toLocaleString('vi-VN')}`,
      icon: CreditCard,
      color: 'teal',
      subtitle: 'Paid to hosts',
      details: {
        totalPaid: stats?.released_payouts || 0,
        percentage: stats?.total_revenue ? Math.round(((stats.released_payouts || 0) / stats.total_revenue) * 100) : 0,
      },
      description: 'Tổng số tiền đã thanh toán cho chủ xe',
    },
  ];

  const quickActions = [
    {
      id: 'users',
      title: 'Manage Users',
      icon: Users,
      description: 'View, edit, and manage user accounts',
      link: '/admin/users',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Users</span>
            <span className="font-semibold text-gray-900 dark:text-white">{stats?.total_users || 0}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
            <span className="font-semibold text-green-600 dark:text-green-400">{stats?.active_users || 0}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/admin/users');
            }}
            className="w-full mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View All Users
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ),
    },
    {
      id: 'vehicles',
      title: 'Approve Vehicles',
      icon: Car,
      description: 'Review and verify vehicle listings',
      link: '/admin/vehicles',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Vehicles</span>
            <span className="font-semibold text-gray-900 dark:text-white">{stats?.total_vehicles || 0}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <span className="text-sm text-amber-700 dark:text-amber-400">Pending Review</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">{stats?.pending_vehicles || 0}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/admin/vehicles?verification_status=PENDING');
            }}
            className="w-full mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Review Pending
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ),
    },
    {
      id: 'bookings',
      title: 'Manage Bookings',
      icon: Calendar,
      description: 'View and manage all bookings',
      link: '/admin/bookings',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</span>
            <span className="font-semibold text-gray-900 dark:text-white">{stats?.total_bookings || 0}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <span className="text-sm text-orange-700 dark:text-orange-400">Active Bookings</span>
            <span className="font-semibold text-orange-600 dark:text-orange-400">{stats?.active_bookings || 0}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/admin/bookings');
            }}
            className="w-full mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            View All Bookings
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ),
    },
    {
      id: 'kyc',
      title: 'KYC Verification',
      icon: FileText,
      description: 'Review and verify user identity documents',
      link: '/admin/kyc',
      content: (
        <div className="space-y-3">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
              <strong>KYC Process:</strong>
            </p>
            <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li>Review identity documents</li>
              <li>Verify user information</li>
              <li>Approve or reject applications</li>
            </ul>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/admin/kyc');
            }}
            className="w-full mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Review Documents
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ),
    },
    {
      id: 'payouts',
      title: 'Manage Payouts',
      icon: Wallet,
      description: 'Release payouts to vehicle hosts',
      link: '/admin/payouts',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <span className="text-sm text-amber-700 dark:text-amber-400">Pending Amount</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              ₫{(stats?.pending_payouts || 0).toLocaleString('vi-VN')}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Pending Count</span>
            <span className="font-semibold text-gray-900 dark:text-white">{stats?.pending_payout_count || 0}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Released</span>
            <span className="font-semibold text-teal-600 dark:text-teal-400">
              ₫{(stats?.released_payouts || 0).toLocaleString('vi-VN')}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/admin/payouts');
            }}
            className="w-full mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            Process Payouts
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const toggleCardExpansion = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  const toggleActionExpansion = (id: string) => {
    setExpandedAction(expandedAction === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Tổng quan thống kê và quản lý nền tảng
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <Activity className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Live</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            const isExpanded = expandedCard === index;
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
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 ${colorClasses[card.color as keyof typeof colorClasses]} transition-all overflow-hidden ${
                  isExpanded ? 'shadow-2xl' : 'hover:shadow-xl'
                }`}
              >
                <div
                  onClick={() => toggleCardExpansion(index)}
                  className="cursor-pointer p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCardExpansion(index);
                      }}
                      className="p-1 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
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
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {card.value}
                  </p>
                  {card.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {card.subtitle}
                    </p>
                  )}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {card.description}
                    </p>
                    <div className="space-y-2">
                      {card.details && Object.entries(card.details).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {typeof value === 'number' && key.includes('percentage')
                              ? `${value}%`
                              : typeof value === 'number' && (key.includes('Revenue') || key.includes('commission') || key.includes('Paid') || key.includes('average'))
                              ? `₫${value.toLocaleString('vi-VN')}`
                              : value}
                          </span>
                        </div>
                      ))}
                    </div>
                    {card.link && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(card.link!);
                        }}
                        className="w-full mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Nhấp vào các card bên dưới để xem thông tin chi tiết và thực hiện hành động
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const isExpanded = expandedAction === action.id;

            return (
              <div
                key={action.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 transition-all overflow-hidden ${
                  isExpanded
                    ? 'border-rose-500 dark:border-rose-500 shadow-2xl'
                    : 'hover:border-rose-500 dark:hover:border-rose-500'
                }`}
              >
                <div
                  onClick={() => toggleActionExpansion(action.id)}
                  className="cursor-pointer p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                      <Icon className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActionExpansion(action.id);
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                  {action.id === 'payouts' && stats?.pending_payout_count && stats.pending_payout_count > 0 && (
                    <span className="inline-block mt-3 px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                      {stats.pending_payout_count} pending
                    </span>
                  )}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 pt-4 animate-in slide-in-from-top-2 duration-200">
                    {action.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

