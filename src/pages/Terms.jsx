import React from 'react';

const sections = [
  {
    title: 'Acceptance of Terms',
    content: `By accessing or using FreelancePro, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not access or use our services.

We may update these terms from time to time. Your continued use of our platform following any changes constitutes acceptance of those changes.`
  },
  {
    title: 'User Accounts',
    content: `You must be at least 18 years old to use our services.

You are responsible for:
- Maintaining the security of your account
- All activities that occur under your account
- Providing accurate and complete information
- Updating your information as needed

We reserve the right to suspend or terminate accounts that violate our terms or policies.`
  },
  {
    title: 'Platform Rules',
    content: `When using our platform, you agree to:
- Comply with all applicable laws and regulations
- Respect the intellectual property rights of others
- Not engage in fraudulent or deceptive practices
- Not harass or abuse other users
- Not attempt to circumvent our payment system
- Not use our platform for illegal activities

Violation of these rules may result in immediate account termination.`
  },
  {
    title: 'Payments and Fees',
    content: `FreelancePro charges fees for its services, including:
- Service fees on project payments
- Processing fees for payment transactions
- Premium service fees (if applicable)

All fees are clearly displayed before transactions are completed. We reserve the right to modify our fee structure with notice to users.`
  },
  {
    title: 'Dispute Resolution',
    content: `Any disputes between users will be handled through our dispute resolution process.

For disputes with FreelancePro:
- We encourage informal resolution first
- Formal disputes must be submitted in writing
- Arbitration will be used for unresolved disputes
- Class action lawsuits are waived

This agreement is governed by [Jurisdiction] law.`
  },
  {
    title: 'Intellectual Property',
    content: `You retain rights to content you create, but grant FreelancePro a license to use it for platform purposes.

FreelancePro's trademarks, logos, and content are protected by intellectual property laws and may not be used without permission.`
  },
  {
    title: 'Limitation of Liability',
    content: `FreelancePro is not liable for:
- Indirect or consequential damages
- Lost profits or data
- Service interruptions
- Third-party actions
- Force majeure events

Our total liability is limited to the amount you've paid us in the past 12 months.`
  }
];

const Terms = () => {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mt-4 text-xl text-gray-500">
            Please read these terms carefully before using our platform
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
              Contact Us
            </h2>
            <p className="text-gray-500 mb-6">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="space-y-2">
              <p className="text-gray-500">
                Email: legal@freelancepro.com
              </p>
              <p className="text-gray-500">
                Address: 123 Legal Street, Tech City, TC 12345
              </p>
              <p className="text-gray-500">
                Phone: +1 (555) 123-4567
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
