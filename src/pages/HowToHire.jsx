import React from 'react';

    function HowToHire() {
      return (
        <div className="min-h-screen bg-light py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-dark mb-4 font-serif">How to Hire</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Learn how to hire the best freelancers for your projects.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6 font-serif">Steps to Hire</h2>
              <ol className="list-decimal list-inside text-gray-700 space-y-4">
                <li>
                  <strong>Post a Job:</strong> Describe your project in detail, including requirements, timeline, and budget.
                </li>
                <li>
                  <strong>Review Proposals:</strong> Receive proposals from qualified freelancers and review their profiles.
                </li>
                <li>
                  <strong>Select a Freelancer:</strong> Choose the best freelancer for your project based on their skills and experience.
                </li>
                <li>
                  <strong>Start Working:</strong> Collaborate with your freelancer and track progress.
                </li>
                <li>
                  <strong>Complete and Pay:</strong> Once the project is completed, release payment and leave a review.
                </li>
              </ol>
            </div>
          </div>
        </div>
      );
    }

    export default HowToHire;
