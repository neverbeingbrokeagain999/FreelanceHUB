import React, { useState } from 'react';
import { toast } from 'react-toastify';

export default function Newsletter() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically make an API call to subscribe
    toast.success('Successfully subscribed to newsletter!');
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-light py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Newsletter</h1>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-6">Stay Updated</h2>
            <p className="text-gray-600 mb-8">
              Subscribe to our newsletter for the latest industry insights, platform updates, 
              and freelancing tips delivered straight to your inbox.
            </p>

            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">What You'll Get:</h3>
              <ul className="space-y-3 text-gray-600">
                <li>✓ Weekly freelancing tips and strategies</li>
                <li>✓ Latest job opportunities and market trends</li>
                <li>✓ Platform feature updates and tutorials</li>
                <li>✓ Success stories from our community</li>
                <li>✓ Exclusive webinar invitations</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-secondary transition"
              >
                Subscribe
              </button>
            </form>

            <p className="text-sm text-gray-500 mt-4">
              By subscribing, you agree to receive marketing communications. 
              You can unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
