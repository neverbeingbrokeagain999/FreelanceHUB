import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import useAdminAuth from '../../hooks/useAdminAuth';
import LoadingSpinner from '../../components/LoadingSpinner';

const DisputeCard = ({ dispute, onResolve }) => (
  <div className="bg-white shadow rounded-lg overflow-hidden">
    <div className="px-4 py-5 sm:px-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Dispute #{dispute.id}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Filed on {new Date(dispute.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${dispute.status === 'open' ? 'bg-red-100 text-red-800' : 
            dispute.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'}`}
        >
          {dispute.status}
        </span>
      </div>
    </div>
    <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <dt className="text-sm font-medium text-gray-500">Contract</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {dispute.contractId}
          </dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-medium text-gray-500">Amount in Dispute</dt>
          <dd className="mt-1 text-sm text-gray-900">
            ${dispute.amount.toLocaleString()}
          </dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-medium text-gray-500">Filed By</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {dispute.filedBy.name}
          </dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-medium text-gray-500">Against</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {dispute.against.name}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm font-medium text-gray-500">Reason</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {dispute.reason}
          </dd>
        </div>
        {dispute.evidence && (
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Evidence</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                {dispute.evidence.map((item, index) => (
                  <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <span className="ml-2 flex-1 w-0 truncate">
                        {item.description}
                      </span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        View
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>
    </div>
    {dispute.status === 'open' && (
      <div className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => onResolve(dispute.id, 'favor_client')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Favor Client
          </button>
          <button
            onClick={() => onResolve(dispute.id, 'favor_freelancer')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Favor Freelancer
          </button>
          <button
            onClick={() => onResolve(dispute.id, 'split')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Split 50/50
          </button>
        </div>
      </div>
    )}
  </div>
);

const AdminDisputes = () => {
  const { loading, resolveDispute } = useAdminAuth();
  const [disputes, setDisputes] = useState([]);
  const [filter, setFilter] = useState('open');
  const [loadingDisputes, setLoadingDisputes] = useState(true);

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        setLoadingDisputes(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/admin/disputes?status=${filter}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch disputes');
        }

        const data = await response.json();
        setDisputes(data.disputes);
      } catch (error) {
        console.error('Error fetching disputes:', error);
      } finally {
        setLoadingDisputes(false);
      }
    };

    fetchDisputes();
  }, [filter]);

  const handleResolve = async (disputeId, resolution) => {
    if (await resolveDispute(disputeId, resolution)) {
      setDisputes(prev => prev.filter(d => d.id !== disputeId));
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Disputes
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and resolve user disputes
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="sm:hidden">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="investigating">Investigating</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <nav className="flex space-x-4" aria-label="Tabs">
            {['open', 'investigating', 'resolved'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`
                  ${filter === tab
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                  px-3 py-2 font-medium text-sm rounded-md capitalize
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {loadingDisputes ? (
        <div className="text-center py-12">
          <LoadingSpinner />
        </div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No {filter} disputes found
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {disputes.map((dispute) => (
            <DisputeCard
              key={dispute.id}
              dispute={dispute}
              onResolve={handleResolve}
            />
          ))}
        </div>
      )}
    </div>
  );
};

DisputeCard.propTypes = {
  dispute: PropTypes.shape({
    id: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['open', 'investigating', 'resolved']).isRequired,
    contractId: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    createdAt: PropTypes.string.isRequired,
    filedBy: PropTypes.shape({
      name: PropTypes.string.isRequired
    }).isRequired,
    against: PropTypes.shape({
      name: PropTypes.string.isRequired
    }).isRequired,
    reason: PropTypes.string.isRequired,
    evidence: PropTypes.arrayOf(
      PropTypes.shape({
        description: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired
      })
    )
  }).isRequired,
  onResolve: PropTypes.func.isRequired
};

export default AdminDisputes;
