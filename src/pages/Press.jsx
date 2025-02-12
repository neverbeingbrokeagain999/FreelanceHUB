import React from 'react';

const pressReleases = [
  {
    title: 'FreelancePro Raises $50M Series B to Expand Global Freelance Platform',
    date: 'February 5, 2025',
    source: 'Business Wire',
    excerpt: 'FreelancePro announced today the successful completion of its Series B funding round, raising $50 million to fuel international expansion and platform development.',
    link: '#'
  },
  {
    title: 'FreelancePro Launches AI-Powered Talent Matching System',
    date: 'January 15, 2025',
    source: 'TechCrunch',
    excerpt: 'The new AI-powered system matches freelancers with projects based on skills, experience, and work preferences, improving hiring success rates by 40%.',
    link: '#'
  },
  {
    title: 'FreelancePro Reports 200% Year-Over-Year Growth',
    date: 'December 10, 2024',
    source: 'Forbes',
    excerpt: 'The platform has seen exceptional growth in both freelancer and client acquisition, with total transaction volume exceeding $1B in 2024.',
    link: '#'
  }
];

const mediaContacts = {
  press: {
    name: 'Sarah Johnson',
    role: 'Head of Communications',
    email: 'press@freelancepro.com'
  },
  media: {
    name: 'Michael Chen',
    role: 'Media Relations Manager',
    email: 'media@freelancepro.com'
  }
};

const Press = () => {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">Press Center</h1>
          <p className="mt-4 text-xl text-gray-500">
            Latest news and updates from FreelancePro
          </p>
        </div>

        <div className="grid gap-12 mb-16">
          {pressReleases.map((release, index) => (
            <div key={index} className="border-b border-gray-200 pb-8">
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <time dateTime={release.date}>{release.date}</time>
                <span className="mx-2">&bull;</span>
                <span>{release.source}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {release.title}
              </h2>
              <p className="text-gray-500 mb-4">
                {release.excerpt}
              </p>
              <a
                href={release.link}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Read More &rarr;
              </a>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Media Contacts
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {Object.entries(mediaContacts).map(([key, contact]) => (
              <div key={key} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 capitalize mb-4">
                  {key} Inquiries
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-900">{contact.name}</p>
                  <p className="text-gray-500">{contact.role}</p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Download Media Kit
          </h2>
          <p className="text-gray-500 mb-6">
            Access logos, brand guidelines, and executive photos
          </p>
          <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            Download Assets
          </button>
        </div>
      </div>
    </div>
  );
};

export default Press;
