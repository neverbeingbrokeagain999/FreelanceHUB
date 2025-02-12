import React, { useEffect, useState } from 'react';
import { useEscrow } from '../../hooks/useEscrow';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';

const EscrowDetails = ({ jobId, clientId, freelancerId, budget }) => {
  const [escrow, setEscrow] = useState(null);
  const { user } = useAuth();
  const {
    loading,
    error,
    success,
    createEscrow,
    fundEscrow,
    releaseEscrow,
    disputeEscrow,
    getEscrowDetails,
    clearMessages
  } = useEscrow();

  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  // Fetch escrow details if they exist
  useEffect(() => {
    const fetchEscrow = async () => {
      try {
        const escrows = await getEscrowDetails(jobId);
        if (escrows && escrows.length > 0) {
          setEscrow(escrows[0]);
        }
      } catch (err) {
        // Escrow might not exist yet, which is fine
        console.log('No escrow found for job');
      }
    };

    fetchEscrow();
  }, [jobId, getEscrowDetails]);

  const handleCreateEscrow = async () => {
    try {
      const result = await createEscrow({
        jobId,
        freelancerId,
        amount: budget,
        paymentGatewayId: 'default', // You might want to let users choose
        paymentMethod: 'credit_card' // You might want to let users choose
      });
      setEscrow(result.escrow);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleReleaseEscrow = async () => {
    if (window.confirm('Are you sure you want to release the funds?')) {
      try {
        const result = await releaseEscrow(escrow._id);
        setEscrow(result.escrow);
      } catch (err) {
        // Error is handled by the hook
      }
    }
  };

  const handleDispute = async (e) => {
    e.preventDefault();
    try {
      const result = await disputeEscrow(escrow._id, disputeReason);
      setEscrow(result);
      setShowDisputeForm(false);
      setDisputeReason('');
    } catch (err) {
      // Error is handled by the hook
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Payment Protection</h3>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
          {error}
          <button className="ml-2 text-sm underline" onClick={clearMessages}>Dismiss</button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-md">
          {success}
          <button className="ml-2 text-sm underline" onClick={clearMessages}>Dismiss</button>
        </div>
      )}

      {!escrow && user._id === clientId && (
        <div>
          <p className="text-gray-600 mb-4">
            Protect your payment by creating an escrow. The funds will be held safely until the work is completed.
          </p>
          <button
            onClick={handleCreateEscrow}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Escrow
          </button>
        </div>
      )}

      {escrow && (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">
                <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                  escrow.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  escrow.status === 'funded' ? 'bg-blue-100 text-blue-800' :
                  escrow.status === 'released' ? 'bg-green-100 text-green-800' :
                  escrow.status === 'disputed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {escrow.status.charAt(0).toUpperCase() + escrow.status.slice(1)}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">{formatCurrency(escrow.amount)}</p>
            </div>
          </div>

          {escrow.status === 'funded' && (
            <div className="space-y-4">
              {user._id === clientId && (
                <button
                  onClick={handleReleaseEscrow}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Release Funds
                </button>
              )}
              
              <button
                onClick={() => setShowDisputeForm(true)}
                className="w-full border border-red-300 text-red-600 px-4 py-2 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Raise Dispute
              </button>
            </div>
          )}

          {showDisputeForm && (
            <form onSubmit={handleDispute} className="mt-4">
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full h-32 p-2 border rounded focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Please describe the reason for the dispute..."
                required
              />
              <div className="mt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeForm(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Submit Dispute
                </button>
              </div>
            </form>
          )}

          {escrow.dispute?.isDisputed && (
            <div className="mt-4 p-4 bg-red-50 rounded">
              <p className="text-red-600 font-medium">Dispute Filed</p>
              <p className="text-sm text-gray-600 mt-1">
                Reason: {escrow.dispute.reason}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Filed on: {new Date(escrow.dispute.disputedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EscrowDetails;
