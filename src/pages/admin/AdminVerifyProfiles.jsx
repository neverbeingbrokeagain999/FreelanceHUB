import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import useAdminAuth from '../../hooks/useAdminAuth';
import LoadingSpinner from '../../components/LoadingSpinner';

const VerificationCard = ({ profile, onVerify, onReject }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
    <div className="px-4 py-5 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img
            className="h-12 w-12 rounded-full"
            src={profile.avatar || '/default-avatar.png'}
            alt=""
          />
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">
              {profile.name}
            </h3>
            <p className="text-sm text-gray-500">
              {profile.email}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Submitted: {new Date(profile.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
    <div className="px-4 py-5 sm:p-6">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <dt className="text-sm font-medium text-gray-500">Role</dt>
          <dd className="mt-1 text-sm text-gray-900">{profile.role}</dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-medium text-gray-500">Location</dt>
          <dd className="mt-1 text-sm text-gray-900">{profile.location}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm font-medium text-gray-500">Skills</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {profile.skills?.join(', ')}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm font-medium text-gray-500">Bio</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {profile.bio}
          </dd>
        </div>
        {profile.documents?.map((doc, index) => (
          <div key={index} className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">
              {doc.type} Document
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-500"
              >
                View Document
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </div>
    <div className="px-4 py-4 sm:px-6 flex justify-end space-x-3">
      <button
        type="button"
        onClick={() => onReject(profile.id)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Reject
      </button>
      <button
        type="button"
        onClick={() => onVerify(profile.id)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Verify
      </button>
    </div>
  </div>
);

const AdminVerifyProfiles = () => {
  const { loading, verifyUser } = useAdminAuth();
  const [profiles, setProfiles] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoadingProfiles(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/admin/verify-profiles?status=${filter}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch profiles');
        }

        const data = await response.json();
        setProfiles(data.profiles);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoadingProfiles(false);
      }
    };

    fetchProfiles();
  }, [filter]);

  const handleVerify = async (profileId) => {
    if (await verifyUser(profileId, 'approve')) {
      setProfiles(prev => prev.filter(p => p.id !== profileId));
    }
  };

  const handleReject = async (profileId) => {
    if (await verifyUser(profileId, 'reject')) {
      setProfiles(prev => prev.filter(p => p.id !== profileId));
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
            Profile Verifications
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Review and verify user profiles
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <nav className="flex space-x-4" aria-label="Tabs">
            {['pending', 'approved', 'rejected'].map((tab) => (
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

      {loadingProfiles ? (
        <div className="text-center py-12">
          <LoadingSpinner />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No {filter} profiles to verify
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {profiles.map((profile) => (
            <VerificationCard
              key={profile.id}
              profile={profile}
              onVerify={handleVerify}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
};

VerificationCard.propTypes = {
  profile: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    role: PropTypes.string.isRequired,
    location: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    bio: PropTypes.string,
    documents: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired
      })
    ),
    createdAt: PropTypes.string.isRequired
  }).isRequired,
  onVerify: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired
};

export default AdminVerifyProfiles;
