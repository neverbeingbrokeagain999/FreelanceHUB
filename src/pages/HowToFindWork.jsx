import React from 'react';

    function HowToFindWork() {
      return (
        <div className="min-h-screen bg-light py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-dark mb-4 font-serif">How to Find Work</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Learn how to find the best freelance opportunities on our platform.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6 font-serif">Steps to Find Work</h2>
              <ol className="list-decimal list-inside text-gray-700 space-y-4">
                <li>
                  <strong>Create a Profile:</strong> Showcase your skills, experience, and portfolio to attract clients.
                </li>
                <li>
                  <strong>Browse Jobs:</strong> Search for jobs that match your skills and interests.
                </li>
                <li>
                  <strong>Submit Proposals:</strong> Send compelling proposals to clients with your best offers.
                </li>
                <li>
                  <strong>Get Hired:</strong> Get hired by clients and start working on exciting projects.
                </li>
                <li>
                  <strong>Get Paid:</strong> Receive secure payments for your work.
                </li>
              </ol>
            </div>
          </div>
        </div>
      );
    }

    export default HowToFindWork;
