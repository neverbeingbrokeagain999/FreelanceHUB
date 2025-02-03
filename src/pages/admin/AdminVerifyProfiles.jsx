import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';

export default function AdminVerifyProfiles() {
  const { addSuccess, addError } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [filters, setFilters] = useState({
    status: 'pending',
    role: 'all'
  });

  useEffect(() => {
    fetchProfiles();
  }, [filters]);

  const fetchProfiles = async () => {
    try {
      const response = await fetch(`/api/admin/profiles?status=${filters.status}&role=${filters.role}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch profiles');
      
      const data = await response.json();
      setProfiles(data);
    } catch (error) {
      console.error('Error:', error);
      addError('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (profileId, action) => {
    try {
      const response = await fetch(`/api/admin/profiles/${profileId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      if (!response.ok) throw new Error('Failed to update profile');

      addSuccess(`Profile ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      fetchProfiles(); // Refresh list
    } catch (error) {
      console.error('Error:', error);
      addError('Failed to update profile status');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Verify Profiles</h1>
        
        <div className="flex space-x-4">
          <select
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select
            value={filters.role}
            onChange={e => setFilters(prev => ({ ...prev, role: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="all">All Roles</option>
            <option value="freelancer">Freelancers</option>
            <option value="client">Clients</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {profiles.map(profile => (
            <li key={profile._id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src={profile.profilePicture || '/default-avatar.png'}
                    alt={profile.name}
                    className="h-12 w-12 rounded-full"
                  />
                  <div className="ml-4">
                    <h2 className="text-lg font-medium text-gray-900">{profile.name}</h2>
                    <p className="text-sm text-gray-500">{profile.email}</p>
                    <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {filters.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleVerify(profile._id, 'approve')}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleVerify(profile._id, 'reject')}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => window.open(`/profile/${profile._id}`, '_blank')}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    View Profile
                  </button>
                </div>
              </div>

              {profile.role === 'freelancer' && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700">Skills</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.role === 'client' && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700">Company Details</h3>
                  <p className="text-sm text-gray-500">{profile.companyName} - {profile.industry}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
