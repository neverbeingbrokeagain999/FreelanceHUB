import React, { useState } from 'react';
import NotificationList from '../components/admin/NotificationList';
import StatCard from '../components/admin/StatCard';
import DisputesTable from '../components/admin/DisputesTable';
import FreelancersTable from '../components/admin/FreelancersTable';
import { useSocket } from '../hooks/useSocket';
import { useAdminData } from '../hooks/useAdminData';
import { useAdminAuth } from '../hooks/useAdminAuth';

function AdminDashboard() {
  const [timeRange, setTimeRange] = useState('week');
  const { data, loading, fetchDashboardData, updateFreelancer, resolveDispute } = useAdminData();
  const { hasPermission, loading: authLoading } = useAdminAuth();
  
  useSocket(() => fetchDashboardData(timeRange));

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  const tabs = {
    overview: {
      label: 'Overview',
      permission: 'view_reports',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={data.stats.totalUsers}
            change={data.stats.userGrowth}
          />
          <StatCard
            title="Active Jobs"
            value={data.stats.totalJobs}
          />
          <StatCard
            title="Platform Earnings"
            value={data.stats.totalEarnings}
            unit="$"
          />
          <StatCard
            title="Dispute Rate"
            value={data.stats.disputeRate}
            unit="%"
          />
        </div>
      )
    },
    freelancers: {
      label: 'Freelancers',
      permission: 'manage_freelancers',
      content: (
        <FreelancersTable
          freelancers={data.freelancers}
          onVerify={(id) => updateFreelancer(id, 'verify')}
          onSuspend={(id) => updateFreelancer(id, 'suspend')}
        />
      )
    },
    disputes: {
      label: 'Disputes',
      permission: 'manage_disputes',
      content: (
        <DisputesTable
          disputes={data.disputes}
          onResolve={resolveDispute}
        />
      )
    }
  };

  // Filter tabs based on permissions
  const availableTabs = Object.entries(tabs).filter(
    ([_, tab]) => hasPermission(tab.permission)
  );

  const [activeTab, setActiveTab] = useState(availableTabs[0]?.[0] || '');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <select
            className="border rounded-lg px-4 py-2"
            value={timeRange}
            onChange={(e) => {
              setTimeRange(e.target.value);
              fetchDashboardData(e.target.value);
            }}
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
        </div>

        {/* Navigation */}
        <nav className="flex space-x-4 mb-8">
          {availableTabs.map(([key, tab]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-lg capitalize ${
                activeTab === key
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="space-y-6">
          {activeTab && tabs[activeTab]?.content}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
