import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function FreelancerDashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState(null);
  const [directContracts, setDirectContracts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'freelancer') {
      navigate('/');
      return;
    }

    const fetchFreelancerJobs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/jobs/freelancer', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setJobs(data.jobs || []);
        } else {
          if (response.status === 401) {
            logout();
          } else {
            const errorData = await response.text();
            console.error('Failed to fetch freelancer jobs:', errorData);
            setError(`Failed to fetch jobs: ${response.status} ${response.statusText}`);
          }
        }
      } catch (error) {
        console.error('Error fetching freelancer jobs:', error);
        setError('Network error while fetching jobs. Please check your connection and try again.');
      }
    };

    const fetchDirectContracts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/direct-contracts', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setDirectContracts(data);
          setLoading(false);
        } else {
          const errorData = await response.text();
          console.error('Failed to fetch direct contracts:', errorData);
          setError(`Failed to fetch contracts: ${response.status} ${response.statusText}`);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching direct contracts:', error);
        setError('Network error while fetching contracts. Please check your connection and try again.');
        setLoading(false);
      }
    };

    fetchFreelancerJobs();
    fetchDirectContracts();
  }, [isAuthenticated, user, navigate, logout]);

  if (loading) {
    return <div className="min-h-screen bg-light py-20">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-light py-20">
        <div className="container mx-auto px-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Initialize empty arrays if data is null
  const jobsList = Array.isArray(jobs) ? jobs : [];
  const contractsList = Array.isArray(directContracts) ? directContracts : [];

  return (
    <div className="min-h-screen bg-light py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-dark mb-4 font-serif">Freelancer Dashboard</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your active bids, accepted jobs, and direct contracts.
          </p>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-sm overflow-x-auto mb-8">
          <h2 className="text-2xl font-semibold mb-6 font-serif">Active Jobs</h2>
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobsList.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-2 text-center text-gray-500">
                    No active jobs found
                  </td>
                </tr>
              ) : (
                jobsList.map((job) => (
                  <tr key={job._id} className="border-b">
                    <td className="px-4 py-2">{job.title}</td>
                    <td className="px-4 py-2">{job.category}</td>
                    <td className="px-4 py-2">{job.status}</td>
                    <td className="px-4 py-2">
                      <Link to={`/job/${job._id}`} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-secondary transition">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-sm overflow-x-auto">
          <h2 className="text-2xl font-semibold mb-6 font-serif">Direct Contracts</h2>
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">Details</th>
                <th className="px-4 py-2">Start Date</th>
                <th className="px-4 py-2">End Date</th>
                <th className="px-4 py-2">Budget</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {contractsList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-2 text-center text-gray-500">
                    No direct contracts found
                  </td>
                </tr>
              ) : (
                contractsList.map((contract) => (
                  <tr key={contract._id} className="border-b">
                    <td className="px-4 py-2">{contract.client.name}</td>
                    <td className="px-4 py-2">{contract.contractDetails}</td>
                    <td className="px-4 py-2">{new Date(contract.startDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{new Date(contract.endDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2">${contract.budget}</td>
                    <td className="px-4 py-2">{contract.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FreelancerDashboard;
