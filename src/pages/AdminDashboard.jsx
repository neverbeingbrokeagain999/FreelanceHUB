import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAdminData } from '../hooks/useAdminData';
import { captureException } from '../config/sentry';

const StatsCard = ({ title, value, icon: Icon, color, to }) => (
  <Link 
    to={to}
    className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
  >
    <div className="flex items-center">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="ml-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-2xl font-semibold text-gray-700">{value}</p>
      </div>
    </div>
  </Link>
);

/**
 * Admin dashboard page showing key metrics and stats
 * @returns {JSX.Element} AdminDashboard component
 */
const AdminDashboard = () => {
  const { data, loading, error, fetchData } = useAdminData();

  useEffect(() => {
    try {
      fetchData();
    } catch (err) {
      captureException(err, {
        tags: { page: 'AdminDashboard' }
      });
    }
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Users',
      value: data?.users?.total || 0,
      icon: UserGroupIcon,
      color: 'bg-blue-600',
      to: '/admin/users'
    },
    {
      title: 'Active Jobs',
      value: data?.jobs?.active || 0,
      icon: BriefcaseIcon,
      color: 'bg-green-600',
      to: '/admin/jobs'
    },
    {
      title: 'Pending Verifications',
      value: data?.verifications?.pending || 0,
      icon: ShieldCheckIcon,
      color: 'bg-yellow-600',
      to: '/admin/verify'
    },
    {
      title: 'Open Disputes',
      value: data?.disputes?.open || 0,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-600',
      to: '/admin/disputes'
    },
    {
      title: 'Contracts',
      value: data?.contracts?.total || 0,
      icon: DocumentTextIcon,
      color: 'bg-purple-600',
      to: '/admin/contracts'
    },
    {
      title: 'Revenue',
      value: `$${data?.revenue?.total || 0}`,
      icon: CurrencyDollarIcon,
      color: 'bg-indigo-600',
      to: '/admin/revenue'
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Admin Dashboard
      </h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
