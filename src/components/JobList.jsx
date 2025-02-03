import React, { useState, useEffect } from 'react';
import axios from 'axios';

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get('/api/v1/jobs/freelancer', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}` // Assuming token is stored in localStorage
          }
        });
        setJobs(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch jobs. Please try again later.');
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Available Jobs</h2>
      {jobs.length === 0 ? (
        <p>No jobs available at the moment.</p>
      ) : (
        <ul>
          {jobs.map((job) => (
            <li key={job._id}>
              <h3>{job.title}</h3>
              <p>Budget: ${job.budget}</p>
              <p>Category: {job.category}</p>
              <p>Skills: {job.skills.join(', ')}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default JobList;
