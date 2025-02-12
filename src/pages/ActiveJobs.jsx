import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const ActiveJobs = () => {
  const { user } = useAuth();

  // Mock data for active jobs
  const [jobs] = useState([
    {
      id: 1,
      title: 'E-commerce Website Development',
      client: {
        name: 'TechCorp Inc.',
        avatar: '/default-avatar.png'
      },
      startDate: '2025-01-15',
      deadline: '2025-03-01',
      progress: 60,
      budget: '$3,000',
      status: 'in_progress',
      nextMilestone: 'Backend API Integration',
      nextDeliverable: '2025-02-20'
    },
    {
      id: 2,
      title: 'Mobile App UI Design',
      client: {
        name: 'StartupX',
        avatar: '/default-avatar.png'
      },
      startDate: '2025-02-01',
      deadline: '2025-02-25',
      progress: 30,
      budget: '$2,500',
      status: 'review',
      nextMilestone: 'User Profile Screens',
      nextDeliverable: '2025-02-15'
    },
    {
      id: 3,
      title: 'API Integration Project',
      client: {
        name: 'DataFlow Solutions',
        avatar: '/default-avatar.png'
      },
      startDate: '2025-02-05',
      deadline: '2025-03-15',
      progress: 15,
      budget: '$4,000',
      status: 'in_progress',
      nextMilestone: 'Authentication System',
      nextDeliverable: '2025-02-28'
    }
  ]);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'review':
        return 'In Review';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Active Jobs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage your ongoing projects
          </p>
        </div>

        <div className="space-y-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={job.client.avatar}
                      alt={job.client.name}
                    />
                    <div className="ml-4">
                      <h2 className="text-lg font-medium text-gray-900">
                        {job.title}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Client: {job.client.name}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                      job.status
                    )}`}
                  >
                    {getStatusText(job.status)}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Budget</h3>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {job.budget}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Deadline</h3>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {job.deadline}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Next Milestone
                    </h3>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {job.nextMilestone}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Progress</h3>
                    <div className="mt-2 flex items-center">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-blue-600 rounded-full"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-500">
                        {job.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    View Details
                  </button>
                  <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    Submit Work
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActiveJobs;
