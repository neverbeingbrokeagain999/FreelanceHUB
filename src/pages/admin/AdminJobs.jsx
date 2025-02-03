import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';

export default function AdminJobs() {
  const { addSuccess, addError } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    compliance: 'all',
    category: 'all'
  });

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/admin/jobs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch jobs');
      
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error:', error);
      addError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleJobAction = async (jobId, action) => {
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`Failed to ${action} job`);

      addSuccess(`Job ${action}d successfully`);
      fetchJobs();
    } catch (error) {
      console.error('Error:', error);
      addError(`Failed to ${action} job`);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Jobs</h1>
        
        <div className="flex space-x-4">
          <select
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            value={filters.compliance}
            onChange={e => setFilters(prev => ({ ...prev, compliance: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="all">All Compliance</option>
            <option value="flagged">Flagged</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Review</option>
          </select>

          <select
            value={filters.category}
            onChange={e => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="all">All Categories</option>
            <option value="development">Development</option>
            <option value="design">Design</option>
            <option value="marketing">Marketing</option>
            <option value="writing">Writing</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {jobs.map(job => (
            <li key={job._id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{job.title}</h2>
                  <div className="mt-1">
                    <span className="text-sm text-gray-500">Posted by: {job.client.name}</span>
                    <span className="mx-2">•</span>
                    <span className="text-sm text-gray-500">Budget: ${job.budget}</span>
                    <span className="mx-2">•</span>
                    <span className="text-sm text-gray-500">Category: {job.category}</span>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      job.compliance === 'flagged' ? 'bg-red-100 text-red-800' :
                      job.compliance === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {job.compliance}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {job.compliance === 'pending' && (
                    <>
                      <button
                        onClick={() => handleJobAction(job._id, 'approve')}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleJobAction(job._id, 'flag')}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      >
                        Flag
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleJobAction(job._id, 'remove')}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => window.open(`/job/${job._id}`, '_blank')}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    View Details
                  </button>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  {job.description.length > 200 
                    ? `${job.description.substring(0, 200)}...` 
                    : job.description}
                </p>
              </div>

              {job.compliance === 'flagged' && (
                <div className="mt-4 bg-red-50 p-4 rounded">
                  <h3 className="text-sm font-medium text-red-800">Compliance Issues:</h3>
                  <ul className="mt-2 list-disc list-inside text-sm text-red-700">
                    {job.complianceIssues?.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
