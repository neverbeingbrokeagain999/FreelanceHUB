import React from 'react';
import { format } from 'date-fns';

const DisputesTable = ({ disputes, onResolve }) => (
  <div className="bg-white rounded-lg shadow">
    <div className="p-6 border-b">
      <h2 className="text-2xl font-semibold">Disputes</h2>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Job
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Freelancer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {disputes.map((dispute) => (
            <tr key={dispute._id}>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{dispute.job.title}</div>
                <div className="text-xs text-gray-500">{format(new Date(dispute.createdAt), 'MMM d, yyyy')}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{dispute.client.name}</div>
                <div className="text-xs text-gray-500">{dispute.client.email}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{dispute.freelancer.name}</div>
                <div className="text-xs text-gray-500">{dispute.freelancer.email}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">${dispute.amount.toFixed(2)}</div>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${
                    dispute.status === 'resolved'
                      ? 'bg-green-100 text-green-800'
                      : dispute.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {dispute.status}
                </span>
              </td>
              <td className="px-6 py-4">
                {dispute.status === 'pending' && (
                  <button
                    onClick={() => onResolve(dispute)}
                    className="text-primary hover:text-primary-dark"
                  >
                    Resolve
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default DisputesTable;
