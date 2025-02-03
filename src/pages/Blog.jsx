import React from 'react';

    function Blog() {
      return (
        <div className="min-h-screen bg-light py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-dark mb-4 font-serif">Blog</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Read our latest articles and insights on freelancing and remote work.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6 font-serif">Latest Articles</h2>
              <p className="text-gray-700 mb-4">
                Stay up-to-date with the latest trends and tips in the freelancing world.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-4">
                <li>
                  <strong>Freelancing Tips:</strong> Get advice on how to succeed as a freelancer.
                </li>
                <li>
                  <strong>Remote Work Trends:</strong> Learn about the latest trends in remote work.
                </li>
                <li>
                  <strong>Client Insights:</strong> Get tips on how to hire the best freelancers.
                </li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    export default Blog;
