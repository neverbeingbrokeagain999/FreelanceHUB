import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';

export default function AdminDisputes() {
  const { addSuccess, addError } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState([]);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [filters, setFilters] = useState({
    status: 'active',
    priority: 'all',
    type: 'all'
  });

  useEffect(() => {
    fetchDisputes();
  }, [filters]);

  const fetchDisputes = async () => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/admin/disputes?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch disputes');
      
      const data = await response.json();
      setDisputes(data);
    } catch (error) {
      console.error('Error:', error);
      addError('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleDisputeAction = async (disputeId, action, resolution = {}) => {
    try {
      const response = await fetch(`/api/admin/disputes/${disputeId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resolution)
      });

      if (!response.ok) throw new Error(`Failed to ${action} dispute`);

      addSuccess(`Dispute ${action}d successfully`);
      fetchDisputes();
      setSelectedDispute(null);
    } catch (error) {
      console.error('Error:', error);
      addError(`Failed to ${action} dispute`);
    }
  };

  const handleEscalate = (disputeId) => {
    handleDisputeAction(disputeId, 'escalate');
  };

  const handleResolve = (disputeId) => {
    if (!selectedDispute?.resolution) {
      addError('Please provide resolution details');
      return;
    }
    handleDisputeAction(disputeId, 'resolve', {
      resolution: selectedDispute.resolution,
      refundAmount: selectedDispute.refundAmount
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Disputes</h1>
        
        <div className="flex space-x-4">
          <select
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="escalated">Escalated</option>
            <option value="all">All Status</option>
          </select>
          
          <select
            value={filters.priority}
            onChange={e => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filters.type}
            onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="all">All Types</option>
            <option value="payment">Payment</option>
            <option value="quality">Quality</option>
            <option value="communication">Communication</option>
            <option value="deadline">Deadline</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Disputes List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {disputes.map(dispute => (
              <li 
                key={dispute._id} 
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  selectedDispute?._id === dispute._id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedDispute(dispute)}
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {dispute.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Contract: {dispute.contract.title}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      dispute.priority === 'high' ? 'bg-red-100 text-red-800' :
                      dispute.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {dispute.priority}
                    </span>
                    <span className="text-sm text-gray-500 mt-1">
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Dispute Details */}
        {selectedDispute && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">
                Dispute Details
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedDispute.description}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Client</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedDispute.client.name}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Freelancer</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedDispute.freelancer.name}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Amount in Dispute</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    ${selectedDispute.amount}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedDispute.type}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Resolution Notes</dt>
                  <dd className="mt-1">
                    <textarea
                      rows={4}
                      className="shadow-sm block w-full sm:text-sm border border-gray-300 rounded-md"
                      value={selectedDispute.resolution || ''}
                      onChange={e => setSelectedDispute(prev => ({ 
                        ...prev, 
                        resolution: e.target.value 
                      }))}
                    />
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Refund Amount</dt>
                  <dd className="mt-1">
                    <input
                      type="number"
                      className="shadow-sm block w-full sm:text-sm border border-gray-300 rounded-md"
                      value={selectedDispute.refundAmount || ''}
                      onChange={e => setSelectedDispute(prev => ({ 
                        ...prev, 
                        refundAmount: e.target.value 
                      }))}
                    />
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => handleEscalate(selectedDispute._id)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                    >
                      Escalate
                    </button>
                    <button
                      onClick={() => handleResolve(selectedDispute._id)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </dl>

              {selectedDispute.messages && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-500">Communication History</h4>
                  <div className="mt-2 space-y-4">
                    {selectedDispute.messages.map((message, index) => (
                      <div key={index} className="flex space-x-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {message.sender}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(message.timestamp).toLocaleString()}
                          </p>
                          <p className="mt-1 text-sm text-gray-900">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
