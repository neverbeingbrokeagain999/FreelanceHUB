import React from 'react';

const categories = [
  {
    title: 'Getting Started',
    icon: '🚀',
    articles: [
      'How to Create an Account',
      'Complete Your Profile',
      'Find Your First Project',
      'Payment Methods'
    ]
  },
  {
    title: 'For Freelancers',
    icon: '💼',
    articles: [
      'Submitting Proposals',
      'Portfolio Best Practices',
      'Setting Your Rates',
      'Getting Paid'
    ]
  },
  {
    title: 'For Clients',
    icon: '🏢',
    articles: [
      'Posting a Job',
      'Hiring Best Practices',
      'Managing Contracts',
      'Payment Protection'
    ]
  },
  {
    title: 'Platform Features',
    icon: '⚡',
    articles: [
      'Video Meetings',
      'Code Collaboration',
      'Time Tracking',
      'Project Milestones'
    ]
  }
];

const popularArticles = [
  'How to Handle Payment Disputes',
  'Best Practices for Project Communication',
  'Understanding Service Fees',
  'Account Security Guidelines'
];

const Help = () => {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">Help Center</h1>
          <p className="mt-4 text-xl text-gray-500">
            Find answers to your questions and learn how to get the most out of FreelancePro
          </p>
          
          {/* Search */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for help articles..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <button className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {categories.map((category, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">{category.icon}</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {category.title}
              </h2>
              <ul className="space-y-2">
                {category.articles.map((article, idx) => (
                  <li key={idx}>
                    <a href="#" className="text-blue-600 hover:text-blue-800">
                      {article}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Popular Articles */}
        <div className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Popular Articles
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {popularArticles.map((article, index) => (
              <a
                key={index}
                href="#"
                className="flex items-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <svg
                  className="h-6 w-6 text-blue-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-gray-900 hover:text-blue-600">
                  {article}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Can&apos;t find what you&apos;re looking for?
          </h2>
          <p className="text-gray-500 mb-6">
            Our support team is here to help
          </p>
          <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default Help;
