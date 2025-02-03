import React from 'react';

    function SuccessStories() {
      return (
        <div className="min-h-screen bg-light py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-dark mb-4 font-serif">Success Stories</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Read inspiring stories from clients and freelancers who have achieved success on our platform.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6 font-serif">Inspiration</h2>
              <p className="text-gray-700 mb-4">
                Discover how our platform has helped clients and freelancers achieve their goals.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-4">
                <li>
                  <strong>Client Success:</strong> Read stories from clients who have found the perfect freelancers for their projects.
                </li>
                <li>
                  <strong>Freelancer Success:</strong> Read stories from freelancers who have built successful careers on our platform.
                </li>
                <li>
                  <strong>Project Spotlights:</strong> Explore some of our most successful projects and collaborations.
                </li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    export default SuccessStories;
