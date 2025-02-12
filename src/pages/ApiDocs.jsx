import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const endpoints = [
  {
    category: 'Authentication',
    items: [
      {
        method: 'POST',
        path: '/api/v1/auth/token',
        description: 'Generate API access token'
      },
      {
        method: 'POST',
        path: '/api/v1/auth/refresh',
        description: 'Refresh access token'
      }
    ]
  },
  {
    category: 'Jobs',
    items: [
      {
        method: 'GET',
        path: '/api/v1/jobs',
        description: 'List all jobs'
      },
      {
        method: 'POST',
        path: '/api/v1/jobs',
        description: 'Create a new job'
      },
      {
        method: 'GET',
        path: '/api/v1/jobs/:id',
        description: 'Get job details'
      }
    ]
  },
  {
    category: 'Users',
    items: [
      {
        method: 'GET',
        path: '/api/v1/users/:id',
        description: 'Get user profile'
      },
      {
        method: 'PUT',
        path: '/api/v1/users/:id',
        description: 'Update user profile'
      }
    ]
  }
];

const codeExamples = {
  curl: `curl -X POST \\
  https://api.freelancepro.com/v1/auth/token \\
  -H 'Content-Type: application/json' \\
  -d '{
    "client_id": "your_client_id",
    "client_secret": "your_client_secret"
  }'`,
  python: `import requests

response = requests.post(
    'https://api.freelancepro.com/v1/auth/token',
    json={
        'client_id': 'your_client_id',
        'client_secret': 'your_client_secret'
    }
)

print(response.json())`,
  javascript: `fetch('https://api.freelancepro.com/v1/auth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    client_id: 'your_client_id',
    client_secret: 'your_client_secret'
  })
})
.then(response => response.json())
.then(data => console.log(data));`
};

const ApiDocs = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('curl');

  const getMethodColor = (method) => {
    const colors = {
      GET: 'bg-green-100 text-green-800',
      POST: 'bg-blue-100 text-blue-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800'
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">API Documentation</h1>
          <p className="mt-4 text-xl text-gray-500">
            Integrate FreelancePro into your applications
          </p>
        </div>

        {/* Getting Started */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-600 mb-4">
              To use the FreelancePro API, you'll need to:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Create an account at FreelancePro</li>
              <li>Generate API credentials in your developer settings</li>
              <li>Use the credentials to authenticate your API requests</li>
            </ol>
          </div>
        </div>

        {/* Authentication Example */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Example</h2>
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="flex border-b border-gray-700">
              {Object.keys(codeExamples).map((lang) => (
                <button
                  key={lang}
                  className={`px-4 py-2 text-sm font-medium ${
                    selectedLanguage === lang
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setSelectedLanguage(lang)}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
              <code>{codeExamples[selectedLanguage]}</code>
            </pre>
          </div>
        </div>

        {/* Endpoints */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">API Endpoints</h2>
          <div className="space-y-8">
            {endpoints.map((category, index) => (
              <div key={index}>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {category.category}
                </h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  {category.items.map((endpoint, idx) => (
                    <div
                      key={idx}
                      className={`p-4 ${
                        idx !== category.items.length - 1 ? 'border-b border-gray-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${getMethodColor(
                            endpoint.method
                          )}`}
                        >
                          {endpoint.method}
                        </span>
                        <code className="text-sm font-mono text-purple-600">
                          {endpoint.path}
                        </code>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {endpoint.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/contact?type=api"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Get API Access
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;
