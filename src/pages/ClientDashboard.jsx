import React, { useState, useEffect } from 'react';
        import { Link } from 'react-router-dom';
        import { User } from 'lucide-react';
import ChatBox from '../components/messaging/ChatBox';

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
            const jobsResponse = await fetch('http://localhost:5000/api/jobs/client', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
            });

            if (!jobsResponse.ok) {
              const errorData = await jobsResponse.json();
              throw new Error(errorData.message || jobsResponse.statusText);
            }

            const jobsData = await jobsResponse.json();

            // Fetch profile
            const profileResponse = await fetch('http://localhost:5000/api/users/profile', {
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

            if (isMounted) {
              setJobs(jobsData.jobs || []);
              setProfilePicture(profileData.profilePicture);
              setProfile(profileData);
              setError(null);
              setLoading(false);
            }
          } catch (error) {
            console.error('Error fetching data:', error);
            if (isMounted) {
              setError(error.message);
              setLoading(false);
              
              if (error.message.includes('token')) {
                localStorage.removeItem('token');
                window.location.href = '/login';
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
        return <div className="min-h-screen bg-light py-20">Loading...</div>;
      }

      return (
        <div className="min-h-screen bg-light py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12 flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-dark mb-4 font-serif">Client Dashboard</h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Manage your active jobs and track their progress.
                </p>
              </div>
              <Link to="/edit-profile" className="rounded-full overflow-hidden w-10 h-10 border-2 border-white">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                )}
              </Link>
            </div>
            {profile && (
              <div className="bg-white p-8 rounded-xl shadow-sm max-w-3xl mx-auto mb-8">
                <h2 className="text-2xl font-semibold mb-6 font-serif">Your Profile</h2>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2 font-serif">Name</h3>
                  <p className="text-gray-700">{profile.name}</p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2 font-serif">Email</h3>
                  <p className="text-gray-700">{profile.email}</p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2 font-serif">Address</h3>
                  <p className="text-gray-700">{profile.address}</p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2 font-serif">Phone</h3>
                  <p className="text-gray-700">{profile.phone}</p>
                </div>
              </div>
            )}

            {/* Chat Box */}
            {jobs.length > 0 && jobs[0].freelancers && jobs[0].freelancers.length > 0 && (
              <div className="max-w-3xl mx-auto mb-8">
                <h2 className="text-2xl font-semibold mb-6 font-serif">Chat with Freelancer</h2>
                <ChatBox jobId={jobs[0]._id} otherUser={jobs[0].freelancers[0]} />
              </div>
            )}


            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <div key={job._id} className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="text-xl font-semibold mb-2 font-serif">{job.title}</h3>
                  <p className="text-gray-600 mb-4">Category: {job.category}</p>
                  <p className="text-gray-600 mb-4">Status: {job.status}</p>
                  <div className="text-right">
                    <Link to={`/job/${job._id}`} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-secondary transition">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    export default ClientDashboard;
