import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const BrowseJobs = () => {
  const { user } = useAuth();
  
  // Mock data for jobs
  const [jobs] = useState([
    {
      id: 1,
      title: 'Full Stack Web Application Development',
      description: 'Looking for an experienced developer to build a complete web application using React and Node.js',
      budget: '$3,000 - $5,000',
      skills: ['React', 'Node.js', 'MongoDB', 'Express'],
      postedDate: '2 hours ago',
      proposals: 5,
      clientRating: 4.8,
      projectLength: 'Medium-term',
      experienceLevel: 'Intermediate'
    },
    {
      id: 2,
      title: 'Mobile App UI/UX Design',
      description: 'Need a talented designer for our iOS and Android app redesign project',
      budget: '$2,000 - $3,000',
      skills: ['UI Design', 'UX Design', 'Figma', 'Mobile Design'],
      postedDate: '5 hours ago',
      proposals: 8,
      clientRating: 4.9,
      projectLength: 'Short-term',
      experienceLevel: 'Expert'
    },
    {
      id: 3,
      title: 'WordPress Website Development',
      description: 'Create a custom WordPress theme and plugin for an e-commerce site',
      budget: '$1,500 - $2,500',
      skills: ['WordPress', 'PHP', 'MySQL', 'WooCommerce'],
      postedDate: '1 day ago',
      proposals: 12,
      clientRating: 4.7,
      projectLength: 'Short-term',
      experienceLevel: 'Intermediate'
    }
  ]);

  const filters = {
    projectLength: ['Short-term', 'Medium-term', 'Long-term'],
    experienceLevel: ['Entry', 'Intermediate', 'Expert'],
    budget: ['$500 - $1,000', '$1,000 - $5,000', '$5,000+']
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
              
              {/* Project Length Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Project Length</h4>
                {filters.projectLength.map((option) => (
                  <label key={option} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-600">{option}</span>
                  </label>
                ))}
              </div>

              {/* Experience Level Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Experience Level</h4>
                {filters.experienceLevel.map((option) => (
                  <label key={option} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-600">{option}</span>
                  </label>
                ))}
              </div>

              {/* Budget Filter */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Budget</h4>
                {filters.budget.map((option) => (
                  <label key={option} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-600">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Jobs List */}
          <div className="col-span-3">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Available Jobs</h2>
              <div className="flex space-x-2">
                <select className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option>Most Recent</option>
                  <option>Best Match</option>
                  <option>Budget: High to Low</option>
                  <option>Budget: Low to High</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                      <p className="mt-2 text-gray-600">{job.description}</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Apply Now
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center text-sm text-gray-500 space-x-4">
                    <span>Posted {job.postedDate}</span>
                    <span>•</span>
                    <span>{job.budget}</span>
                    <span>•</span>
                    <span>{job.proposals} proposals</span>
                    <span>•</span>
                    <span>Client rating: {job.clientRating}/5</span>
                  </div>

                  <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                    <span>{job.projectLength}</span>
                    <span>•</span>
                    <span>{job.experienceLevel} level</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseJobs;
