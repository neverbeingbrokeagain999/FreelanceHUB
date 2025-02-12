import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import ChatBox from '../components/messaging/ChatBox';
import LoadingSpinner from '../components/LoadingSpinner';

function ClientDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [freelancer, setFreelancer] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        // Fetch jobs
    const jobsResponse = await fetch('/api/jobs/client', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!jobsResponse.ok) {
      const errorData = await jobsResponse.text();
      let errorMessage;
      try {
        const parsedError = JSON.parse(errorData);
        errorMessage = parsedError.message || parsedError.error || jobsResponse.statusText;
      } catch (e) {
        errorMessage = errorData || jobsResponse.statusText;
      }
      throw new Error(errorMessage);
    }

    let jobsData;
    try {
      jobsData = await jobsResponse.json();
      if (!jobsData || !Array.isArray(jobsData.jobs)) {
        throw new Error('Invalid response format');
      }
    } catch (parseError) {
      console.error('Error parsing jobs response:', parseError);
      throw new Error('Failed to parse server response');
    }

        // Fetch profile
        const profileResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          throw new Error(errorData.message || profileResponse.statusText);
        }

        const profileData = await profileResponse.json();
        console.log('profileData:', profileData);

        if (isMounted) {
          setJobs(jobsData.jobs || []);
          let profileInfo = {};
          if (profileData && typeof profileData === 'object' && Object.keys(profileData).length > 0) {
            profileInfo = {
              ...profileData,
              profilePicture: profileData.profilePicture || profileData.profile?.profilePicture,
              name: profileData.name || profileData.profile?.name,
              email: profileData.email || profileData.profile?.email,
              address: profileData.address?.street ?
                `${profileData.address.street}, ${profileData.address.city}, ${profileData.address.state}, ${profileData.address.zipCode}, ${profileData.address.country}` :
                profileData.profile?.address?.street ?
                `${profileData.profile.address.street}, ${profileData.profile.address.city}, ${profileData.profile.address.state}, ${profileData.profile.address.zipCode}, ${profileData.profile.address.country}` :
                null,
              phone: profileData.phone
            };
          }
          setProfilePicture(profileInfo.profilePicture);
          setProfile(profileInfo);
          setError(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        if (isMounted) {
          const errorMessage = error.message || 'An error occurred while fetching data';
          setError(errorMessage);
          setLoading(false);
          
          if (errorMessage.includes('token') || jobsResponse?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
          
          if (jobsResponse?.status === 500) {
            setError('Server error occurred. Please try again later.');
          }
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-light py-20 flex items-center justify-center">
      <LoadingSpinner />
    </div>;
  }

  return (
    <div className="min-h-screen bg-light py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl font-semibold mb-6 font-serif">Your Profile</h2>
        <div className="bg-white p-8 rounded-xl shadow-sm max-w-3xl mx-auto mb-8">
          {profilePicture && (
            <img src={profilePicture} alt="Profile" className="w-24 h-24 rounded-full mb-4" />
          )}
          <h3 className="text-xl font-semibold">{profile?.name}</h3>
          <p className="text-gray-700">{profile?.email}</p>
          <p className="text-gray-700">{profile?.address}</p>
          <p className="text-gray-700">{profile?.phone}</p>
        </div>
      </div>
      {error ? ( 
        <div className="container mx-auto px-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-6">
          {jobs.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold font-serif">Your Jobs</h2>
                <Link to="/post-job" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Post New Job
                </Link>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm max-w-3xl mx-auto mb-8">
                {jobs.map(job => (
                  <div key={job._id} className="border-b last:border-b-0 py-4">
                    <h3 className="text-xl font-semibold">{job.title}</h3>
                    <p className="text-gray-700 mt-2">{job.description}</p>
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-gray-500">Budget: ${job.budget.min} - ${job.budget.max}</p>
                      <p className="text-gray-500">Status: <span className={
                        job.status === 'published' ? 'text-green-600' :
                        job.status === 'draft' ? 'text-yellow-600' :
                        'text-gray-600'
                      }>{job.status}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-700">No jobs found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ClientDashboard;
