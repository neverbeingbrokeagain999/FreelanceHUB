import React from 'react';
import { Link } from 'react-router-dom';

export default function Features() {
  return (
    <div className="min-h-screen bg-light py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Platform Features</h1>
          <p className="text-xl text-gray-600">Everything you need for successful freelancing</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Project Management */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Project Management</h3>
            <ul className="space-y-3 text-gray-600">
              <li>• Milestone tracking</li>
              <li>• Task management</li>
              <li>• Project timelines</li>
              <li>• File sharing</li>
              <li>• Progress reporting</li>
            </ul>
          </div>

          {/* Payment Protection */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Protection</h3>
            <ul className="space-y-3 text-gray-600">
              <li>• Escrow system</li>
              <li>• Milestone payments</li>
              <li>• Secure transactions</li>
              <li>• Payment tracking</li>
              <li>• Multiple currencies</li>
            </ul>
          </div>

          {/* Communication Tools */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Communication Tools</h3>
            <ul className="space-y-3 text-gray-600">
              <li>• Real-time chat</li>
              <li>• Video calls</li>
              <li>• Screen sharing</li>
              <li>• File sharing</li>
              <li>• Message history</li>
            </ul>
          </div>

          {/* Time Tracking */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Time Tracking</h3>
            <ul className="space-y-3 text-gray-600">
              <li>• Automated tracking</li>
              <li>• Work diaries</li>
              <li>• Activity levels</li>
              <li>• Time reports</li>
              <li>• Billing integration</li>
            </ul>
          </div>

          {/* Talent Verification */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Talent Verification</h3>
            <ul className="space-y-3 text-gray-600">
              <li>• Skills testing</li>
              <li>• Portfolio verification</li>
              <li>• ID verification</li>
              <li>• Reference checks</li>
              <li>• Work history</li>
            </ul>
          </div>

          {/* Support & Training */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Support & Training</h3>
            <ul className="space-y-3 text-gray-600">
              <li>• 24/7 support</li>
              <li>• Learning resources</li>
              <li>• Community forums</li>
              <li>• Success guides</li>
              <li>• Video tutorials</li>
            </ul>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to get started?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/signup?type=freelancer"
              className="inline-block px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition"
            >
              Join as Freelancer
            </Link>
            <Link
              to="/signup?type=client"
              className="inline-block px-8 py-3 bg-white text-primary font-medium rounded-lg border-2 border-primary hover:bg-primary/5 transition"
            >
              Hire Talent
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
