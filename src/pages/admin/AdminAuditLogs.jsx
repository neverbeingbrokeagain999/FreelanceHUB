import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import AuditLogDetails from '../../components/admin/AuditLogDetails';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    targetType: '',
    severity: '',
    startDate: '',
    endDate: '',
    isReviewed: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { authHeader } = useAdminAuth();

  useEffect(() => {
    fetchAuditLogs();
  }, [pagination.page, filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await axios.get(
        `/api/admin/audit-logs?${queryParams}`,
        { headers: authHeader }
      );

      setLogs(response.data.data.logs);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.pagination.total
      }));
    } catch (err) {
      setError('Failed to fetch audit logs');
      toast.error('Error loading audit logs');
      console.error('Audit logs fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleReviewLog = async (logId, notes) => {
    try {
      await axios.post(
        `/api/admin/audit-logs/${logId}/review`,
        { notes },
        { headers: authHeader }
      );

      toast.success('Audit log reviewed successfully');
      fetchAuditLogs();
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to review audit log');
      console.error('Review audit log error:', err);
    }
  };

  const handleLogClick = (log) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 font-bold';
      case 'HIGH': return 'text-orange-500 font-semibold';
      case 'MEDIUM': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (loading && !logs.length) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Audit Logs</h1>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            name="action"
            value={filters.action}
            onChange={handleFilterChange}
            className="form-select rounded border-gray-300"
          >
            <option value="">All Actions</option>
            <option value="USER_UPDATE">User Update</option>
            <option value="SYSTEM_CONFIG_UPDATE">System Config Update</option>
            <option value="USER_ROLE_CHANGE">Role Change</option>
          </select>

          <select
            name="targetType"
            value={filters.targetType}
            onChange={handleFilterChange}
            className="form-select rounded border-gray-300"
          >
            <option value="">All Types</option>
            <option value="USER">User</option>
            <option value="SYSTEM">System</option>
            <option value="JOB">Job</option>
          </select>

          <select
            name="severity"
            value={filters.severity}
            onChange={handleFilterChange}
            className="form-select rounded border-gray-300"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="form-input rounded border-gray-300"
          />

          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="form-input rounded border-gray-300"
          />

          <select
            name="isReviewed"
            value={filters.isReviewed}
            onChange={handleFilterChange}
            className="form-select rounded border-gray-300"
          >
            <option value="">Review Status</option>
            <option value="true">Reviewed</option>
            <option value="false">Not Reviewed</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr 
                key={log._id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleLogClick(log)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(log.metadata.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.action}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.targetType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={getSeverityColor(log.severity)}>
                    {log.severity}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 
                    log.status === 'FAILURE' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.userId?.name || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const notes = prompt('Enter review notes:');
                      if (notes) handleReviewLog(log._id, notes);
                    }}
                    className="text-indigo-600 hover:text-indigo-900"
                    disabled={log.isReviewed}
                  >
                    {log.isReviewed ? 'Reviewed' : 'Review'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4">
        <Pagination
          currentPage={pagination.page}
          totalPages={Math.ceil(pagination.total / pagination.limit)}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        />
      </div>

      {/* Details Modal */}
      <AuditLogDetails
        log={selectedLog}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
};

export default AdminAuditLogs;
