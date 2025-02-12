import React from 'react';
import PropTypes from 'prop-types';

const JobListItem = ({ job, onActionClick }) => {
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadgeClass(
                job.status
              )}`}
            >
              {job.status}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{job.description}</p>

          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span className="mr-2">Posted by:</span>
            <span className="font-medium text-gray-900 mr-1">{job.client.name}</span>
            <span className="mr-2">•</span>
            <span>Rating: {job.client.rating}/5</span>
            <span className="mx-2">•</span>
            <span>Budget: {job.budget}</span>
            <span className="mx-2">•</span>
            <span>Created: {job.createdAt}</span>
          </div>
        </div>

        <div className="ml-4 flex-shrink-0 flex space-x-2">
          <button
            onClick={() => onActionClick(job, 'view')}
            className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View
          </button>
          <button
            onClick={() => onActionClick(job, 'approve')}
            className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Approve
          </button>
          <button
            onClick={() => onActionClick(job, 'reject')}
            className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

JobListItem.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    budget: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    client: PropTypes.shape({
      name: PropTypes.string.isRequired,
      rating: PropTypes.number.isRequired
    }).isRequired
  }).isRequired,
  onActionClick: PropTypes.func.isRequired
};

export default JobListItem;
