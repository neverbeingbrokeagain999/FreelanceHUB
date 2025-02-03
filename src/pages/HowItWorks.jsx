import React from 'react';
import { Link } from 'react-router-dom';

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-light py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How FreelanceHUB Works</h1>
          <p className="text-xl text-gray-600">Simple steps to start your freelancing journey</p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto mb-20">
          {/* For Freelancers */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">For Freelancers</h2>
            <div className="space-y-8">
              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-primary font-bold mr-3">1</div>
                  <h3 className="font-semibold text-lg">Create your profile</h3>
                </div>
                <p className="text-gray-600 ml-11">Showcase your skills, experience, and portfolio to stand out to clients.</p>
              </div>
              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-primary font-bold mr-3">2</div>
                  <h3 className="font-semibold text-lg">Browse jobs</h3>
                </div>
                <p className="text-gray-600 ml-11">Search for projects that match your skills and submit proposals.</p>
              </div>
              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-primary font-bold mr-3">3</div>
                  <h3 className="font-semibold text-lg">Get hired</h3>
                </div>
                <p className="text-gray-600 ml-11">Discuss project details with clients and start working on exciting projects.</p>
              </div>
              <Link to="/signup?type=freelancer" className="block text-center bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-dark transition">
                Join as Freelancer
              </Link>
            </div>
          </div>

          {/* For Clients */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">For Clients</h2>
            <div className="space-y-8">
              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-primary font-bold mr-3">1</div>
                  <h3 className="font-semibold text-lg">Post a job</h3>
                </div>
                <p className="text-gray-600 ml-11">Describe your project and the skills required to get started.</p>
              </div>
              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-primary font-bold mr-3">2</div>
                  <h3 className="font-semibold text-lg">Review proposals</h3>
                </div>
                <p className="text-gray-600 ml-11">Compare freelancer proposals and portfolios to find the perfect match.</p>
              </div>
              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-primary font-bold mr-3">3</div>
                  <h3 className="font-semibold text-lg">Award & work</h3>
                </div>
                <p className="text-gray-600 ml-11">Choose your freelancer and collaborate to achieve great results.</p>
              </div>
              <Link to="/signup?type=client" className="block text-center bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-dark transition">
                Post a Job
              </Link>
            </div>
          </div>

          {/* Platform Features */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Features</h2>
            <div className="space-y-8">
              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-primary font-bold mr-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg">Secure payments</h3>
                </div>
                <p className="text-gray-600 ml-11">Payment protection and milestone-based releases for peace of mind.</p>
              </div>
              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-primary font-bold mr-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg">Communication tools</h3>
                </div>
                <p className="text-gray-600 ml-11">Built-in messaging, file sharing, and video calls for seamless collaboration.</p>
              </div>
              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-primary font-bold mr-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg">Quality assurance</h3>
                </div>
                <p className="text-gray-600 ml-11">Verified profiles, skills tests, and review system to maintain high standards.</p>
              </div>
              <Link to="/features" className="block text-center bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-dark transition">
                View All Features
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-2">How much does it cost to join?</h3>
              <p className="text-gray-600">It's free to join and create a profile. We only charge fees when you successfully complete a project. Check our <Link to="/pricing" className="text-primary hover:underline">pricing page</Link> for details.</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-2">Is my payment secure?</h3>
              <p className="text-gray-600">Yes, we use escrow payments to protect both clients and freelancers. Funds are only released when both parties are satisfied with the work.</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-2">What if I'm not satisfied with the work?</h3>
              <p className="text-gray-600">We have a dispute resolution process and dedicated support team to help resolve any issues that may arise during a project.</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-2">Can I hire teams?</h3>
              <p className="text-gray-600">Yes, you can hire individual freelancers or entire teams. For larger projects, check out our <Link to="/enterprise" className="text-primary hover:underline">enterprise solutions</Link>.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
