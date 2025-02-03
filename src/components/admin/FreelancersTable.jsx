import React from 'react';

const FreelancersTable = ({ freelancers, onVerify, onSuspend }) => (
  <div className="bg-white rounded-lg shadow">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Freelancer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Skills
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
          {freelancers.map((freelancer) => (
            <tr key={freelancer._id}>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <img
                    className="h-10 w-10 rounded-full"
                    src={freelancer.avatar || '/default-avatar.png'}
                    alt=""
                  />
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">{freelancer.name}</div>
                    <div className="text-sm text-gray-500">{freelancer.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-2">
                  {freelancer.skills.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                  {freelancer.skills.length > 3 && (
                    <span className="text-sm text-gray-500">
                      +{freelancer.skills.length - 3} more
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${
                    freelancer.status === 'verified'
                      ? 'bg-green-100 text-green-800'
                      : freelancer.status === 'suspended'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {freelancer.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  {freelancer.status !== 'verified' && (
                    <button
                      onClick={() => onVerify(freelancer._id)}
                      className="bg-primary text-white px-3 py-1 rounded-lg hover:bg-opacity-90"
                    >
                      Verify
                    </button>
                  )}
                  {freelancer.status !== 'suspended' && (
                    <button
                      onClick={() => onSuspend(freelancer._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                    >
                      Suspend
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default FreelancersTable;
