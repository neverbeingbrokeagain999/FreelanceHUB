import React from 'react';

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-light py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-12">API Documentation</h1>

          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <p className="text-gray-600 mb-6">
              Our REST API lets you integrate our platform's functionality into your applications.
            </p>
            <div className="bg-gray-100 rounded p-4">
              <code>Base URL: https://api.platform.com/v1</code>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
            <p className="text-gray-600 mb-4">
              Use API keys to authenticate your requests. Include the key in the Authorization header:
            </p>
            <div className="bg-gray-100 rounded p-4 mb-4">
              <code>Authorization: Bearer YOUR_API_KEY</code>
            </div>
            <button className="bg-primary text-white font-bold py-2 px-4 rounded hover:bg-secondary transition">
              Get API Key
            </button>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Endpoints</h2>
              
              <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
                <h3 className="text-xl font-semibold mb-2">Jobs</h3>
                <div className="space-y-4">
                  <div>
                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">GET</span>
                    <code>/jobs</code>
                    <p className="text-gray-600 mt-1">List all jobs</p>
                  </div>
                  <div>
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2">POST</span>
                    <code>/jobs</code>
                    <p className="text-gray-600 mt-1">Create a new job</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
                <h3 className="text-xl font-semibold mb-2">Users</h3>
                <div className="space-y-4">
                  <div>
                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">GET</span>
                    <code>/users/{'{id}'}</code>
                    <p className="text-gray-600 mt-1">Get user details</p>
                  </div>
                  <div>
                    <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm mr-2">PUT</span>
                    <code>/users/{'{id}'}</code>
                    <p className="text-gray-600 mt-1">Update user profile</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-2">Proposals</h3>
                <div className="space-y-4">
                  <div>
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2">POST</span>
                    <code>/jobs/{'{id}'}/proposals</code>
                    <p className="text-gray-600 mt-1">Submit a proposal</p>
                  </div>
                  <div>
                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">GET</span>
                    <code>/jobs/{'{id}'}/proposals</code>
                    <p className="text-gray-600 mt-1">List proposals for a job</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-semibold mb-4">Rate Limits</h2>
              <ul className="space-y-2 text-gray-600">
                <li>• 1000 requests per hour for authenticated endpoints</li>
                <li>• 100 requests per hour for unauthenticated endpoints</li>
                <li>• Webhook rate limits: 10 webhook events per second</li>
              </ul>
            </section>

            <div className="bg-primary/5 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
              <p className="text-gray-600 mb-6">Have questions about our API? Our developer support team is here to help.</p>
              <button className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-secondary transition">
                Contact Developer Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
