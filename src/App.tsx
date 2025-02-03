import React from 'react';
import { 
  Briefcase, 
  Users, 
  Shield, 
  MessageSquare, 
  Star, 
  CreditCard,
  ChevronRight,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-8 h-8" />
            <span className="text-xl font-bold">FreelanceHub</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="hover:text-blue-200 transition">Features</a>
            <a href="#how-it-works" className="hover:text-blue-200 transition">How it Works</a>
            <a href="#pricing" className="hover:text-blue-200 transition">Pricing</a>
          </div>
          <div className="flex space-x-4">
            <button className="px-4 py-2 rounded-lg hover:text-blue-200 transition">Login</button>
            <button className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition">
              Sign Up
            </button>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              Connect with Top Freelancers for Your Next Big Project
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              The most trusted marketplace for freelancers and businesses. Find the perfect match for your project needs.
            </p>
            <div className="flex space-x-4">
              <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center">
                Post a Job <ChevronRight className="ml-2" />
              </button>
              <button className="px-8 py-4 border-2 border-white rounded-lg font-semibold hover:bg-blue-600 transition">
                Find Work
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">Core Features</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: <Users className="w-8 h-8 text-blue-600" />,
                title: "Expert Freelancers",
                description: "Access a global pool of verified professionals across multiple disciplines."
              },
              {
                icon: <Shield className="w-8 h-8 text-blue-600" />,
                title: "Secure Payments",
                description: "Protected transactions with escrow system and multiple payment options."
              },
              {
                icon: <MessageSquare className="w-8 h-8 text-blue-600" />,
                title: "Real-time Chat",
                description: "Seamless communication between clients and freelancers."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
                {feature.icon}
                <h3 className="text-xl font-semibold mt-4 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Post a Job", desc: "Describe your project and budget" },
              { step: "2", title: "Get Proposals", desc: "Review bids from qualified freelancers" },
              { step: "3", title: "Choose & Hire", desc: "Select the best fit for your project" },
              { step: "4", title: "Complete Project", desc: "Work together and get results" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: "1M+", label: "Freelancers" },
              { number: "50K+", label: "Active Projects" },
              { number: "95%", label: "Client Satisfaction" },
              { number: "$500M+", label: "Paid to Freelancers" }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-8">Ready to Get Started?</h2>
          <div className="flex justify-center space-x-4">
            <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition">
              Post a Job
            </button>
            <button className="px-8 py-4 border-2 border-white rounded-lg font-semibold hover:bg-blue-600 transition">
              Join as Freelancer
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Briefcase className="w-6 h-6" />
                <span className="text-lg font-bold text-white">FreelanceHub</span>
              </div>
              <p className="text-sm">Connecting talent with opportunity in the digital age.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Clients</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">How to Hire</a></li>
                <li><a href="#" className="hover:text-white transition">Talent Marketplace</a></li>
                <li><a href="#" className="hover:text-white transition">Payment Protection</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Freelancers</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">How to Find Work</a></li>
                <li><a href="#" className="hover:text-white transition">Direct Contracts</a></li>
                <li><a href="#" className="hover:text-white transition">Getting Paid</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Help & Support</a></li>
                <li><a href="#" className="hover:text-white transition">Success Stories</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
            <p>&copy; 2025 FreelanceHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
