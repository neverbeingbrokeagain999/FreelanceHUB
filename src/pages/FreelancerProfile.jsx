import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const FreelancerProfile = () => {
  const { user } = useAuth();
  const [profile] = useState({
    name: user?.name || 'Test User',
    title: 'Full Stack Developer',
    hourlyRate: '$50/hr',
    rating: 4.8,
    jobsCompleted: 45,
    skills: ['React', 'Node.js', 'TypeScript', 'Python', 'AWS'],
    bio: 'Full stack developer with 5+ years of experience building scalable web applications.',
    portfolio: [
      {
        title: 'E-commerce Platform',
        description: 'Built a full-featured e-commerce platform using MERN stack',
        technologies: ['React', 'Node.js', 'MongoDB', 'Express']
      },
      {
        title: 'Real-time Chat Application',
        description: 'Developed a WebSocket-based chat application with file sharing',
        technologies: ['Socket.io', 'React', 'Node.js', 'AWS S3']
      }
    ]
  });

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex sm:space-x-5">
              <div className="flex-shrink-0">
                <img
                  className="mx-auto h-20 w-20 rounded-full"
                  src={user?.avatar || '/default-avatar.png'}
                  alt="Profile"
                />
              </div>
              <div className="mt-4 text-center sm:mt-0 sm:pt-1 sm:text-left">
                <p className="text-sm text-gray-500">Welcome back,</p>
                <p className="text-xl font-bold text-gray-900 sm:text-2xl">
                  {profile.name}
                </p>
                <p className="text-sm font-medium text-gray-600">{profile.title}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-center sm:mt-0">
              <button className="flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow mb-6">
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3 p-6">
            <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500">Hourly Rate</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{profile.hourlyRate}</dd>
            </div>
            <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500">Rating</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{profile.rating}/5</dd>
            </div>
            <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500">Jobs Completed</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{profile.jobsCompleted}</dd>
            </div>
          </dl>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">About Me</h3>
          <p className="text-gray-600">{profile.bio}</p>
        </div>

        {/* Portfolio */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {profile.portfolio.map((project, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900">{project.title}</h4>
                <p className="mt-2 text-gray-600">{project.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerProfile;
