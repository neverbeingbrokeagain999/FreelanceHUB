import React from 'react';

const sections = [
  {
    title: 'What Are Cookies',
    content: `Cookies are small text files that are placed on your computer or mobile device when you visit our website. They are widely used to make websites work more efficiently and provide useful information to website owners.

We use both session cookies (which expire when you close your browser) and persistent cookies (which stay on your device until you delete them or they expire).`
  },
  {
    title: 'How We Use Cookies',
    content: `We use cookies for several purposes:

Essential Cookies:
- Maintaining your session while logged in
- Remembering your preferences
- Ensuring platform security

Analytics Cookies:
- Understanding how users interact with our platform
- Measuring page views and traffic sources
- Identifying areas for improvement

Functionality Cookies:
- Remembering your language preferences
- Customizing content based on your user type
- Saving your settings for future visits

Marketing Cookies:
- Delivering relevant advertisements
- Measuring marketing campaign effectiveness
- Tracking referral sources`
  },
  {
    title: 'Third-Party Cookies',
    content: `We also allow trusted third parties to place cookies on your device. These partners include:

- Analytics providers (e.g., Google Analytics)
- Advertising networks
- Payment processors
- Social media platforms

These third parties have their own privacy policies and may track your activity across other websites.`
  },
  {
    title: 'Managing Cookies',
    content: `You can control cookies through your browser settings. You can:

- Block all cookies
- Delete existing cookies
- Allow cookies only from specific websites
- Prevent third-party cookies

Please note that blocking some types of cookies may impact your experience on our website and the services we can offer.

Different browsers have different controls for cookies. Please check your browser's help section for specific instructions.`
  },
  {
    title: 'Cookie Preferences',
    content: `You can manage your cookie preferences on our platform at any time:

1. Essential cookies cannot be disabled as they are necessary for the website to function
2. You can choose to enable or disable:
   - Analytics cookies
   - Functionality cookies
   - Marketing cookies

Your preferences will be saved and remembered for future visits.`
  }
];

const Cookies = () => {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">Cookie Policy</h1>
          <p className="mt-4 text-xl text-gray-500">
            How we use cookies to improve your experience
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Last updated: February 1, 2025
          </p>
        </div>

        <div className="prose prose-lg mx-auto">
          {sections.map((section, index) => (
            <div key={index} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {section.title}
              </h2>
              <div className="text-gray-500 whitespace-pre-line">
                {section.content}
              </div>
            </div>
          ))}

          <div className="mt-16 bg-gray-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Cookie Settings
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Essential Cookies</h3>
                  <p className="text-sm text-gray-500">Required for basic functionality</p>
                </div>
                <button className="px-3 py-1 bg-gray-200 text-gray-500 rounded" disabled>
                  Always On
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Analytics Cookies</h3>
                  <p className="text-sm text-gray-500">Help us improve our website</p>
                </div>
                <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Enabled
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Marketing Cookies</h3>
                  <p className="text-sm text-gray-500">Personalized advertisements</p>
                </div>
                <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                  Disabled
                </button>
              </div>
            </div>

            <button className="mt-8 w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cookies;
