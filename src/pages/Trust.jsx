import React from 'react';
import { Link } from 'react-router-dom';

export default function Trust() {
  return (
    <div className="min-h-screen bg-light py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Trust & Security</h1>
          <p className="text-xl text-gray-600">Your security is our top priority</p>
        </div>

        {/* Security Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Identity Verification</h3>
            <ul className="space-y-3 text-gray-600">
              <li>• ID verification for all users</li>
              <li>• Business verification</li>
              <li>• Document authentication</li>
              <li>• Profile validation</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Protection</h3>
            <ul className="space-y-3 text-gray-600">
              <li>• Secure payment processing</li>
              <li>• Escrow protection</li>
              <li>• Fraud prevention</li>
              <li>• Dispute resolution</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Data Security</h3>
            <ul className="space-y-3 text-gray-600">
              <li>• SSL encryption</li>
              <li>• Data privacy controls</li>
              <li>• Regular security audits</li>
              <li>• GDPR compliance</li>
            </ul>
          </div>
        </div>

        {/* Risk Prevention */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How We Protect You</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">For Clients</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-1 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Only pay for completed work through our secure payment system</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-1 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Review verified work history and feedback before hiring</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-1 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Get support for dispute resolution and mediation</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">For Freelancers</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-1 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Guaranteed payment for completed milestones</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-1 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Clear contract terms and scope definition</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-1 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Protection against fraud and non-payment</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Compliance & Certifications */}
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Compliance & Certifications</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">Security Standards</h3>
              <ul className="space-y-3 text-gray-600">
                <li>• PCI DSS Level 1 Certified</li>
                <li>• SOC 2 Type II Compliant</li>
                <li>• ISO 27001 Certified</li>
                <li>• GDPR Compliant</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Privacy Compliance</h3>
              <ul className="space-y-3 text-gray-600">
                <li>• EU-US Privacy Shield</li>
                <li>• CCPA Compliant</li>
                <li>• Regular Privacy Audits</li>
                <li>• Data Protection Officer</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact & Support */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Need Support?</h2>
          <p className="text-gray-600 mb-8">Our trust and safety team is available 24/7 to assist you with any concerns</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/support"
              className="inline-block px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition"
            >
              Contact Support
            </Link>
            <Link
              to="/report"
              className="inline-block px-8 py-3 bg-white text-primary font-medium rounded-lg border-2 border-primary hover:bg-primary/5 transition"
            >
              Report an Issue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
