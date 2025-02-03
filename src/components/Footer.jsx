import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Instagram, Github } from '../components/icons';

export default function Footer() {
  const footerLinks = {
    'For Clients': [
      { name: 'How to Hire', path: '/how-to-hire' },
      { name: 'Talent Marketplace', path: '/marketplace' },
      { name: 'Payment Protection', path: '/payment-protection' },
      { name: 'Enterprise Solutions', path: '/enterprise' },
      { name: 'Success Stories', path: '/success-stories' }
    ],
    'For Freelancers': [
      { name: 'How to Find Work', path: '/how-to-find-work' },
      { name: 'Direct Contracts', path: '/direct-contracts' },
      { name: 'Browse Jobs', path: '/browse-jobs' },
      { name: 'Learning Hub', path: '/learning' },
      { name: 'Community', path: '/community' }
    ],
    'Resources': [
      { name: 'Help & Support', path: '/support' },
      { name: 'Trust & Security', path: '/trust' },
      { name: 'API Documentation', path: '/api-docs' },
      { name: 'Partner Program', path: '/partners' },
      { name: 'Newsletter', path: '/newsletter' }
    ],
    'Company': [
      { name: 'About Us', path: '/about' },
      { name: 'Careers', path: '/careers' },
      { name: 'Press', path: '/press' },
      { name: 'Contact Us', path: '/contact' },
      { name: 'Blog', path: '/blog' }
    ]
  };

  const socialLinks = [
    { icon: <Facebook className="w-5 h-5" />, path: 'https://facebook.com' },
    { icon: <Twitter className="w-5 h-5" />, path: 'https://twitter.com' },
    { icon: <Linkedin className="w-5 h-5" />, path: 'https://linkedin.com' },
    { icon: <Instagram className="w-5 h-5" />, path: 'https://instagram.com' },
    { icon: <Github className="w-5 h-5" />, path: 'https://github.com' }
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Logo and Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <img src="/logo.png" alt="FreelanceHub" className="h-10 w-auto brightness-0 invert" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white tracking-tight">FreelanceHUB</span>
                <span className="text-xs font-medium text-blue-400 tracking-wider">
                  CONNECT & SUCCEED
                </span>
              </div>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              The most trusted marketplace for freelancers and businesses worldwide. 
              Connect, collaborate, and achieve success together.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-white font-semibold mb-4">{title}</h3>
              <ul className="space-y-3">
                {links.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.path}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile Apps Section */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="mb-6 sm:mb-0">
              <h3 className="text-white font-semibold mb-2">Get the FreelanceHUB App</h3>
              <p className="text-gray-400">Available on iOS and Android</p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="block">
                <img 
                  src="/app-store.svg" 
                  alt="Download on App Store" 
                  className="h-10"
                />
              </a>
              <a href="#" className="block">
                <img 
                  src="/play-store.svg" 
                  alt="Get it on Google Play" 
                  className="h-10"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-wrap justify-center md:justify-start gap-6 mb-4 md:mb-0">
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/cookies" className="text-gray-400 hover:text-white transition-colors">
                Cookie Settings
              </Link>
              <Link to="/accessibility" className="text-gray-400 hover:text-white transition-colors">
                Accessibility
              </Link>
            </div>
            <div className="text-gray-400">
              © {new Date().getFullYear()} FreelanceHUB. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
