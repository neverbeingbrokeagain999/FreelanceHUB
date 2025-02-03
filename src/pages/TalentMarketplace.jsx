import React from 'react';

    function TalentMarketplace() {
      return (
        <div className="min-h-screen bg-light py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-dark mb-4 font-serif">Talent Marketplace</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Explore our marketplace to find top freelancers for your projects.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6 font-serif">Find Top Talent</h2>
              <p className="text-gray-700 mb-4">
                Our marketplace is filled with skilled professionals ready to help you with your projects.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-4">
                <li>
                  <strong>Browse Freelancers:</strong> Search for freelancers by skills, experience, and ratings.
                </li>
                <li>
                  <strong>View Profiles:</strong> Review freelancer profiles, portfolios, and client reviews.
                </li>
                <li>
                  <strong>Connect Directly:</strong> Contact freelancers directly to discuss your project needs.
                </li>
                <li>
                  <strong>Hire with Confidence:</strong> Choose from a wide range of verified professionals.
                </li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    export default TalentMarketplace;
