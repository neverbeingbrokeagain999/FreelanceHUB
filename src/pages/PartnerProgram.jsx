import React from 'react';

export default function PartnerProgram() {
  return (
    <div className="min-h-screen bg-light py-20">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl font-bold text-center mb-12">Partner Program</h1>

        <div className="max-w-4xl mx-auto space-y-12">
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-6">Program Benefits</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">For Agencies</h3>
                <ul className="space-y-3 text-gray-600">
                  <li>✓ Priority support</li>
                  <li>✓ Dedicated account manager</li>
                  <li>✓ Commission discounts</li>
                  <li>✓ Co-marketing opportunities</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">For Freelancers</h3>
                <ul className="space-y-3 text-gray-600">
                  <li>✓ Referral bonuses</li>
                  <li>✓ Featured profile placement</li>
                  <li>✓ Early access to new features</li>
                  <li>✓ Premium support</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-6">Partner Tiers</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 border rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Silver</h3>
                <ul className="space-y-2 text-gray-600 mb-6">
                  <li>• 5% commission discount</li>
                  <li>• Basic support</li>
                  <li>• Standard features</li>
                </ul>
                <p className="font-semibold">$1,000/month in revenue</p>
              </div>
              <div className="p-6 border rounded-lg bg-primary/5 border-primary">
                <h3 className="text-xl font-semibold mb-4">Gold</h3>
                <ul className="space-y-2 text-gray-600 mb-6">
                  <li>• 10% commission discount</li>
                  <li>• Priority support</li>
                  <li>• Premium features</li>
                </ul>
                <p className="font-semibold">$5,000/month in revenue</p>
              </div>
              <div className="p-6 border rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Platinum</h3>
                <ul className="space-y-2 text-gray-600 mb-6">
                  <li>• 15% commission discount</li>
                  <li>• Dedicated manager</li>
                  <li>• All features + early access</li>
                </ul>
                <p className="font-semibold">$10,000/month in revenue</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-6">How to Join</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-4">1</div>
                <h3 className="font-semibold mb-2">Apply</h3>
                <p className="text-gray-600">Submit your application with your portfolio and experience</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-4">2</div>
                <h3 className="font-semibold mb-2">Review</h3>
                <p className="text-gray-600">Our team will review your application within 48 hours</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-4">3</div>
                <h3 className="font-semibold mb-2">Start Earning</h3>
                <p className="text-gray-600">Begin earning commissions and accessing exclusive benefits</p>
              </div>
            </div>
          </section>

          <div className="bg-primary/5 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Ready to Become a Partner?</h2>
            <p className="text-gray-600 mb-6">Join our network of successful agencies and freelancers.</p>
            <button className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-secondary transition">
              Apply Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
