import React from 'react';

export default function Community() {
  return (
    <div className="min-h-screen bg-light py-20">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl font-bold text-center mb-8">Community</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-4">Forums</h2>
            <p className="text-gray-600 mb-4">Connect with other freelancers and clients to share experiences and best practices.</p>
            <a href="#" className="text-primary hover:underline">Join Discussion →</a>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-4">Events</h2>
            <p className="text-gray-600 mb-4">Attend virtual and in-person events to network and learn from industry experts.</p>
            <a href="#" className="text-primary hover:underline">View Calendar →</a>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-4">Success Stories</h2>
            <p className="text-gray-600 mb-4">Read inspiring stories from our community members and their journey to success.</p>
            <a href="#" className="text-primary hover:underline">Read Stories →</a>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-4">Blog</h2>
            <p className="text-gray-600 mb-4">Stay updated with the latest trends, tips, and insights from our community.</p>
            <a href="#" className="text-primary hover:underline">Read Blog →</a>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-4">Meetups</h2>
            <p className="text-gray-600 mb-4">Join local freelancer meetups and networking events in your area.</p>
            <a href="#" className="text-primary hover:underline">Find Meetups →</a>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-4">Help Center</h2>
            <p className="text-gray-600 mb-4">Get support from our community moderators and helpful resources.</p>
            <a href="#" className="text-primary hover:underline">Get Help →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
