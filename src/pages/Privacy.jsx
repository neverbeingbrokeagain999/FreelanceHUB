import React from 'react';

const sections = [
  {
    title: 'Information We Collect',
    content: `We collect information that you provide directly to us, including:
    - Personal information (name, email, phone number)
    - Professional information (skills, work history, portfolio)
    - Payment information (banking details, transaction history)
    - Communications (messages, proposals, reviews)
    We also automatically collect certain information about your use of our platform.`
  },
  {
    title: 'How We Use Your Information',
    content: `We use the information we collect to:
    - Provide and improve our services
    - Match freelancers with relevant projects
    - Process payments and prevent fraud
    - Send notifications and updates
    - Analyze platform usage and trends
    - Comply with legal obligations`
  },
  {
    title: 'Information Sharing',
    content: `We may share your information with:
    - Other platform users (as necessary for service delivery)
    - Service providers and business partners
    - Law enforcement (when required by law)
    We never sell your personal information to third parties.`
  },
  {
    title: 'Your Rights and Choices',
    content: `You have the right to:
    - Access your personal information
    - Correct inaccurate information
    - Request deletion of your information
    - Opt-out of marketing communications
    - Control cookie preferences`
  }
];

const Privacy = () => {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-4 text-xl text-gray-500">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
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
              Contact Us About Privacy
            </h2>
            <p className="text-gray-500 mb-6">
              If you have any questions or concerns about our privacy practices, please contact our Data Protection Officer:
            </p>
            <div className="space-y-2">
              <p className="text-gray-500">
                Email: privacy@freelancepro.com
              </p>
              <p className="text-gray-500">
                Address: 123 Privacy Street, Tech City, TC 12345
              </p>
              <p className="text-gray-500">
                Phone: +1 (555) 123-4567
              </p>
            </div>
          </div>

          <div className="mt-16 text-sm text-gray-500">
            <p>
              This privacy policy may be updated from time to time. We will notify you of any material changes by posting the new privacy policy on this page and updating the "Last updated" date.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
