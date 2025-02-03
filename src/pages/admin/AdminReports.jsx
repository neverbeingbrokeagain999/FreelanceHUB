import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';

const StatCard = ({ title, value, subtitle, trend }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {trend && (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          trend > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
  </div>
);

export default function AdminReports() {
  const { addError } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [stats, setStats] = useState({
    overview: {},
    earnings: {},
    users: {},
    compliance: {}
  });

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/admin/stats?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch statistics');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error:', error);
      addError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        
        <select
          value={timeRange}
          onChange={e => setTimeRange(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Platform Overview */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Active Jobs"
            value={stats.overview.activeJobs}
            trend={stats.overview.activeJobsTrend}
          />
          <StatCard
            title="Total Users"
            value={stats.overview.totalUsers}
            subtitle={`${stats.overview.newUsers} new this period`}
          />
          <StatCard
            title="Success Rate"
            value={`${stats.overview.successRate}%`}
            trend={stats.overview.successRateTrend}
          />
          <StatCard
            title="Active Disputes"
            value={stats.overview.activeDisputes}
            subtitle={`${stats.overview.resolvedDisputes} resolved`}
          />
        </div>
      </div>

      {/* Earnings Overview */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Earnings Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.earnings.totalRevenue)}
            trend={stats.earnings.revenueTrend}
          />
          <StatCard
            title="Platform Fees"
            value={formatCurrency(stats.earnings.platformFees)}
          />
          <StatCard
            title="Average Job Value"
            value={formatCurrency(stats.earnings.avgJobValue)}
          />
          <StatCard
            title="Escrow Balance"
            value={formatCurrency(stats.earnings.escrowBalance)}
          />
        </div>
      </div>

      {/* User Activity */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">User Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="New Freelancers"
            value={stats.users.newFreelancers}
            subtitle="This period"
          />
          <StatCard
            title="New Clients"
            value={stats.users.newClients}
            subtitle="This period"
          />
          <StatCard
            title="Active Contracts"
            value={stats.users.activeContracts}
            trend={stats.users.activeContractsTrend}
          />
          <StatCard
            title="Avg Response Time"
            value={`${stats.users.avgResponseTime}h`}
            trend={stats.users.responseTimeTrend}
          />
        </div>
      </div>

      {/* Compliance Metrics */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Compliance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Profile Verifications"
            value={stats.compliance.pendingVerifications}
            subtitle="Pending review"
          />
          <StatCard
            title="Job Compliance"
            value={`${stats.compliance.jobComplianceRate}%`}
            subtitle={`${stats.compliance.flaggedJobs} flagged`}
          />
          <StatCard
            title="Dispute Rate"
            value={`${stats.compliance.disputeRate}%`}
            trend={stats.compliance.disputeRateTrend}
          />
          <StatCard
            title="Resolution Time"
            value={`${stats.compliance.avgResolutionTime}d`}
            subtitle="Average days to resolve"
          />
        </div>
      </div>

      {/* Detailed Reports Link */}
      <div className="mt-8 text-center">
        <button
          onClick={() => window.open('/admin/reports/details', '_blank')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none"
        >
          View Detailed Reports
        </button>
      </div>
    </div>
  );
}
