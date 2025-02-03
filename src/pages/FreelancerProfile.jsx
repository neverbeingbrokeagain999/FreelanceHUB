import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

export default function FreelancerProfile() {
  const { user } = useAuthContext();
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }

        // If no ID is provided, fetch the current user's profile
        const endpoint = id 
          ? `/api/users/freelancer/${id}`
          : `/api/users/freelancer/${user.id}`;
          
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Profile data:', data);
        setProfile(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchProfile();
    } else {
      setLoading(false);
      setError('Please log in to view profile');
    }
  }, [id, user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
          <Link to="/login" className="text-primary hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!profile || !profile.user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900">Profile not found</h1>
          {user?.role === 'freelancer' && (
            <div className="mt-4">
              <p className="text-gray-600">Your profile hasn't been created yet.</p>
              <Link
                to="/edit-profile"
                className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
              >
                Create Profile
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-primary to-primary-dark" />

          {/* Profile Info */}
          <div className="relative px-6 pt-16 pb-6">
            {/* Profile Picture */}
            <div className="absolute -top-16 left-6">
              <img
                src={profile.user.profilePicture || '/default-avatar.png'}
                alt={profile.user.name}
                className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
              />
            </div>

            {/* Actions */}
            {user?.id === profile.user._id && (
              <div className="absolute top-4 right-6">
                <Link
                  to="/edit-profile"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark"
                >
                  Edit Profile
                </Link>
              </div>
            )}

            {/* Basic Info */}
            <div className="mt-6">
              <h1 className="text-2xl font-bold text-gray-900">{profile.user.name}</h1>
              {profile.title && (
                <p className="text-lg text-gray-600 mt-1">{profile.title}</p>
              )}
              <p className="text-gray-500">{profile.user.email}</p>
              {profile.user.availability && (
                <p className="mt-2 text-sm text-gray-500 flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    profile.user.availability === 'available' ? 'bg-green-500' :
                    profile.user.availability === 'busy' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  {profile.user.availability.charAt(0).toUpperCase() + profile.user.availability.slice(1)}
                </p>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">About</h2>
                <p className="mt-2 text-gray-500">{profile.bio}</p>
              </div>
            )}

            {/* Skills */}
            {profile.skills?.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">Skills</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary-light text-primary-dark"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rate */}
            {profile.hourlyRate > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">Hourly Rate</h2>
                <p className="mt-2 text-2xl font-bold text-primary">
                  ${profile.hourlyRate}/hr
                </p>
              </div>
            )}

            {/* Experience */}
            {profile.experience?.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">Experience</h2>
                <div className="mt-2 space-y-4">
                  {profile.experience.map((exp, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4">
                      <h3 className="font-medium text-gray-900">{exp.position}</h3>
                      <p className="text-gray-600">{exp.company}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(exp.from).toLocaleDateString()} - {exp.to ? new Date(exp.to).toLocaleDateString() : 'Present'}
                      </p>
                      <p className="mt-1 text-gray-500">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
