import React from 'react';

export default function Learning() {
  return (
    <div className="min-h-screen bg-light py-20">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl font-bold text-center mb-8">Learning Hub</h1>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-4">Courses</h2>
            <ul className="space-y-3">
              <li>Web Development</li>
              <li>Mobile Development</li>
              <li>UI/UX Design</li>
              <li>Data Science</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-4">Resources</h2>
            <ul className="space-y-3">
              <li>Tutorials</li>
              <li>Documentation</li>
              <li>Case Studies</li>
              <li>Best Practices</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-4">Community</h2>
            <ul className="space-y-3">
              <li>Forums</li>
              <li>Study Groups</li>
              <li>Mentorship</li>
              <li>Events</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
