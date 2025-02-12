import React from 'react';
import { Link } from 'react-router-dom';

const benefits = [
  {
    title: 'Revenue Share',
    description: 'Earn up to 20% commission on referred client payments for the first year',
    icon: '💰'
  },
  {
    title: 'Marketing Support',
    description: 'Access co-branded marketing materials and dedicated partner support',
    icon: '📢'
  },
  {
    title: 'Partner Portal',
    description: 'Track referrals, commissions, and campaign performance in real-time',
    icon: '📊'
  },
  {
    title: 'Early Access',
    description: 'Get first access to new features and influence our product roadmap',
    icon: '🎯'
  }
];

const partnerTypes = [
  {
    title: 'Agency Partners',
    description: 'Digital agencies looking to expand their service offerings',
    features: [
      'White-label options',
      'Team collaboration tools',
      'Priority support',
      'Custom training'
    ]
  },
  {
    title: 'Technology Partners',
    description: 'Software companies seeking integration opportunities',
    features: [
      'API access',
      'Integration support',
      'Co-marketing opportunities',
      'Technical documentation'
    ]
  },
  {
    title: 'Referral Partners',
    description: 'Individuals and companies with relevant networks',
    features: [
      'Simple referral tracking',
      'Marketing resources',
      'Commission payouts',
      'Partner community access'
    ]
  }
];

const PartnerProgram = () => {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">Partner Program</h1>
          <p className="mt-4 text-xl text-gray-500">
            Grow your business by partnering with the leading freelance platform
          </p>
        </div>

        {/* Benefits Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Partner Benefits
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-8 text-center hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-500">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Partner Types Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Partnership Types
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {partnerTypes.map((type, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-8 hover:shadow-md transition-shadow">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {type.title}
                </h3>
                <p className="text-gray-500 mb-6">
                  {type.description}
                </p>
                <ul className="space-y-3">
                  {type.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-gray-600">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Partner With Us?
          </h2>
          <p className="text-xl text-gray-500 mb-8">
            Join our partner network and start growing your business today
          </p>
          <div className="space-x-4">
            <Link 
              to="/contact?type=partner"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Apply Now
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
            >
              Contact Partner Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerProgram;
