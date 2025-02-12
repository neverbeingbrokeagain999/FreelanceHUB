import React from 'react';
import { Link } from 'react-router-dom';

const steps = [
  {
    title: 'Create Your Profile',
    description: 'Build a comprehensive profile showcasing your skills, experience, and portfolio.',
    icon: '👤'
  },
  {
    title: 'Find Projects',
    description: 'Browse through thousands of projects or get matched with opportunities that fit your expertise.',
    icon: '🔍'
  },
  {
    title: 'Submit Proposals',
    description: 'Send personalized proposals to clients explaining how you can help with their projects.',
    icon: '✉️'
  },
  {
    title: 'Get Hired',
    description: 'Discuss project details with clients and start working once terms are agreed upon.',
    icon: '🤝'
  },
  {
    title: 'Complete Work',
    description: 'Collaborate efficiently using our platform tools and deliver quality work.',
    icon: '✅'
  },
  {
    title: 'Get Paid Securely',
    description: 'Receive payments safely through our secure payment protection system.',
    icon: '💰'
  }
];

const features = [
  {
    title: 'Payment Protection',
    description: 'Your payments are held safely in escrow until work is completed and approved.',
    icon: '🔒'
  },
  {
    title: 'Real-time Collaboration',
    description: 'Built-in tools for video meetings, document sharing, and project management.',
    icon: '🤝'
  },
  {
    title: 'Quality Matching',
    description: 'AI-powered matching system connects you with the right opportunities.',
    icon: '🎯'
  }
];

const HowItWorks = () => {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">
            How FreelancePro Works
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Your journey to successful freelancing starts here
          </p>
        </div>

        {/* Steps Section */}
        <div className="mb-20">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-8 relative hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{step.icon}</div>
                <div className="absolute top-4 right-4 text-gray-300 text-xl font-bold">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Platform Features
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-500 mb-8">
            Join thousands of freelancers and clients already using FreelancePro
          </p>
          <div className="space-x-4">
            <Link 
              to="/signup?type=freelancer"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Sign Up as Freelancer
            </Link>
            <Link
              to="/signup?type=client"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
            >
              Hire Freelancers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
