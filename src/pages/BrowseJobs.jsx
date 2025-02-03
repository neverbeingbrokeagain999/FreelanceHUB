import React, { useState, useEffect } from 'react';
    import { Link } from 'react-router-dom';

    function BrowseJobs() {
      const [jobs, setJobs] = useState([]);
      const [loading, setLoading] = useState(true);
      const [search, setSearch] = useState('');
      const [categories, setCategories] = useState('');
      const [minBudget, setMinBudget] = useState('');
      const [maxBudget, setMaxBudget] = useState('');
      const [location, setLocation] = useState('');

      useEffect(() => {
        const fetchJobs = async () => {
          try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/jobs/freelancer?search=${search}&categories=${categories}&minBudget=${minBudget}&maxBudget=${maxBudget}&location=${location}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (response.ok) {
              const responseData = await response.json();
              if (responseData && Array.isArray(responseData.data)) {
                setJobs(responseData.data);
              } else {
                setJobs([]);
              }
              setLoading(false);
            } else {
              console.error('Failed to fetch jobs:', response.statusText);
              setLoading(false);
            }
          } catch (error) {
            console.error('Error fetching jobs:', error);
            setLoading(false);
          }
        };

        fetchJobs();
      }, [search, categories, minBudget, maxBudget, location]);

      if (loading) {
        return <div className="min-h-screen bg-light py-20">Loading...</div>;
      }

      return (
        <div className="min-h-screen bg-light py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-dark mb-4 font-serif">Browse Jobs</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Explore available job listings and find opportunities that match your skills.
              </p>
            </div>
            <div className="mb-6 flex space-x-4">
              <input
                type="text"
                placeholder="Search by keywords"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="shadow appearance-none border rounded w-1/4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <input
                type="text"
                placeholder="Categories (comma-separated)"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                className="shadow appearance-none border rounded w-1/4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <input
                type="number"
                placeholder="Min Budget"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                className="shadow appearance-none border rounded w-1/8 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <input
                type="number"
                placeholder="Max Budget"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="shadow appearance-none border rounded w-1/8 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="shadow appearance-none border rounded w-1/4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <div key={job._id} className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="text-xl font-semibold mb-2 font-serif">{job.title}</h3>
                  <p className="text-gray-600 mb-4">Category: {job.category}</p>
                  <p className="text-gray-600 mb-4">Budget: ${job.budget}</p>
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

    export default BrowseJobs;
