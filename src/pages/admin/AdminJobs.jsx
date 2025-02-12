import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import useAdminData from '../../hooks/useAdminData';
import useAdminAuth from '../../hooks/useAdminAuth';
import JobFilters from '../../components/admin/JobFilters';
import JobListItem from '../../components/admin/JobListItem';
import JobActionModal from '../../components/admin/JobActionModal';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';

const initialFilters = {
  status: 'all',
  type: 'all',
  search: '',
  sort: 'created_at:desc',
  minBudget: '',
  maxBudget: '',
  dateFrom: '',
  dateTo: ''
};

const AdminJobs = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [actionType, setActionType] = useState(null);
  const { loading, error, data = {}, filters, updateFilters, fetchData } = useAdminData(initialFilters);
  const { moderateJob } = useAdminAuth();

  const handleFilterChange = useCallback((newFilters) => {
    updateFilters(newFilters);
  }, [updateFilters]);

  const handleFilterReset = useCallback(() => {
    updateFilters(initialFilters);
  }, [updateFilters]);

  const handlePageChange = useCallback((page) => {
    fetchData(page);
  }, [fetchData]);

  const handleJobAction = useCallback((job, action) => {
    setSelectedJob(job);
    setActionType(action === 'view' ? null : action);
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedJob(null);
    setActionType(null);
  }, []);

  const handleActionConfirm = useCallback(async (reason) => {
    try {
      await moderateJob(selectedJob.id, actionType, reason);
      toast.success(`Job successfully ${actionType}ed`);
      fetchData(data.currentPage || 1);
      handleModalClose();
    } catch (err) {
      toast.error(`Failed to ${actionType} job: ${err.message}`);
    }
  }, [selectedJob, actionType, moderateJob, fetchData, data?.currentPage, handleModalClose]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center text-red-600">
              <p>Error loading jobs: {error}</p>
              <button
                onClick={() => fetchData(data?.currentPage || 1)}
                className="mt-4 btn-primary"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Jobs</h1>
          <p className="mt-2 text-sm text-gray-700">
            Review, approve, and manage job postings
          </p>
        </div>

        <JobFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleFilterReset}
        />

        {loading ? (
          <div className="mt-6 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-4">
              {data.jobsList?.length === 0 ? (
                <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
                  No jobs found matching your filters
                </div>
              ) : (
                data.jobsList?.map(job => (
                  <JobListItem
                    key={job.id}
                    job={job}
                    onActionClick={handleJobAction}
                  />
                ))
              )}
            </div>

            {(data.totalPages > 1) && (
              <div className="mt-6">
                <Pagination
                  currentPage={data.currentPage}
                  totalPages={data.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}

        {selectedJob && actionType && (
          <JobActionModal
            isOpen={true}
            onClose={handleModalClose}
            job={selectedJob}
            action={actionType}
            onConfirm={handleActionConfirm}
          />
        )}
      </div>
    </div>
  );
};

export default AdminJobs;
