import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { Menu, X, Bell, MessageSquare, ChevronDown } from '../components/icons';

export default function Navbar() {
  const { user, logout } = useAuthContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getProfileLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'freelancer':
        return '/freelancer-profile';
      case 'client':
        return '/client-dashboard';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  const navbarClasses = `fixed top-0 w-full z-50 transition-all duration-300 ${
    scrolled 
      ? 'bg-white shadow-lg py-2' 
      : 'bg-transparent py-4'
  }`;

  const linkClasses = `px-3 py-2 rounded text-sm font-medium transition-all duration-300 ${
    scrolled
      ? 'text-gray-700 hover:text-primary'
      : location.pathname === '/' 
        ? 'text-white hover:text-blue-100'
        : 'text-gray-700 hover:text-primary'
  }`;

  const mobileMenuClasses = `
    fixed inset-0 bg-white z-40 transform transition-transform duration-300 ease-in-out
    ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      <nav className={navbarClasses}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center space-x-3">
                <img
                  src="/logo.png"
                  alt="Freelance Hub"
                  className="h-10 w-auto"
                />
                <div className="flex flex-col">
                  <span className={`text-xl font-bold tracking-tight ${
                    scrolled || location.pathname !== '/' ? 'text-gray-900' : 'text-white'
                  }`}>
                    FreelanceHUB
                  </span>
                  <span className={`text-xs font-medium tracking-wider ${
                    scrolled || location.pathname !== '/' ? 'text-primary' : 'text-blue-100'
                  }`}>
                    CONNECT & SUCCEED
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {user?.role === 'freelancer' && (
                <>
                  <Link to="/browse-jobs" className={linkClasses}>Find Jobs</Link>
                  <Link to="/freelancer-dashboard" className={linkClasses}>Dashboard</Link>
                  <Link to="/direct-contracts" className={linkClasses}>Contracts</Link>
                </>
              )}
              {user?.role === 'client' && (
                <>
                  <Link to="/post-job" className={linkClasses}>Post Job</Link>
                  <Link to="/client-dashboard" className={linkClasses}>Dashboard</Link>
                  <Link to="/direct-contracts" className={linkClasses}>Contracts</Link>
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <Link to="/admin/verify-profiles" className={linkClasses}>Verify Profiles</Link>
                  <Link to="/admin/jobs" className={linkClasses}>Monitor Jobs</Link>
                  <Link to="/admin/disputes" className={linkClasses}>Disputes</Link>
                </>
              )}
              <Link to="/how-it-works" className={linkClasses}>How It Works</Link>
              <Link to="/pricing" className={linkClasses}>Pricing</Link>
            </div>

            {/* User Menu & Mobile Toggle */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* Notification Icons */}
                  <div className="hidden md:flex items-center space-x-4">
                    <button className={`p-2 rounded-full hover:bg-gray-100 ${
                      scrolled || location.pathname !== '/' ? 'text-gray-600' : 'text-white'
                    }`}>
                      <Bell className="w-5 h-5" />
                    </button>
                    <Link to="/direct-messages" className={`p-2 rounded-full hover:bg-gray-100 ${
                      scrolled || location.pathname !== '/' ? 'text-gray-600' : 'text-white'
                    }`}>
                      <MessageSquare className="w-5 h-5" />
                    </Link>
                  </div>

                  {/* User Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center space-x-2 focus:outline-none"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center border-2 border-white shadow-md">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${
                        dropdownOpen ? 'rotate-180' : ''
                      } ${scrolled || location.pathname !== '/' ? 'text-gray-600' : 'text-white'}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>

                        {user?.role === 'freelancer' && (
                          <>
                            <Link
                              to="/earnings"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={closeDropdown}
                            >
                              Earnings
                            </Link>
                            <Link
                              to="/job-alerts"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={closeDropdown}
                            >
                              Job Alerts
                            </Link>
                          </>
                        )}

                        {user?.role === 'client' && (
                          <>
                            <Link
                              to="/payment-methods"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={closeDropdown}
                            >
                              Payment Methods
                            </Link>
                            <Link
                              to="/transaction-history"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={closeDropdown}
                            >
                              Transaction History
                            </Link>
                          </>
                        )}

                        <Link
                          to="/edit-profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={closeDropdown}
                        >
                          Edit Profile
                        </Link>

                        <Link
                          to={getProfileLink()}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={closeDropdown}
                        >
                          Your Profile
                        </Link>

                        <button
                          onClick={() => {
                            closeDropdown();
                            logout();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <Link
                    to="/login"
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      scrolled || location.pathname !== '/'
                        ? 'text-gray-700 hover:text-primary'
                        : 'text-white hover:text-blue-100'
                    }`}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-md focus:outline-none"
              >
                <Menu className={`w-6 h-6 ${
                  scrolled || location.pathname !== '/' ? 'text-gray-600' : 'text-white'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={mobileMenuClasses}>
        <div className="h-full flex flex-col bg-white shadow-xl">
          <div className="flex items-center justify-between px-4 py-6 sm:px-6">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="Freelance Hub" className="h-8 w-auto" />
              <span className="font-bold text-xl text-gray-900">FreelanceHUB</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-6 space-y-6 sm:px-6">
              {user?.role === 'freelancer' && (
                <>
                  <Link
                    to="/browse-jobs"
                    className="block text-base font-medium text-gray-900 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Find Jobs
                  </Link>
                  <Link
                    to="/freelancer-dashboard"
                    className="block text-base font-medium text-gray-900 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </>
              )}

              {user?.role === 'client' && (
                <>
                  <Link
                    to="/post-job"
                    className="block text-base font-medium text-gray-900 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Post Job
                  </Link>
                  <Link
                    to="/client-dashboard"
                    className="block text-base font-medium text-gray-900 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </>
              )}

              <Link
                to="/how-it-works"
                className="block text-base font-medium text-gray-900 hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                to="/pricing"
                className="block text-base font-medium text-gray-900 hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>

              {!user && (
                <div className="pt-6">
                  <Link
                    to="/login"
                    className="block w-full px-4 py-3 text-center font-medium text-primary bg-primary-50 hover:bg-primary-100 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="mt-4 block w-full px-4 py-3 text-center font-medium text-white bg-primary hover:bg-primary-600 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {(dropdownOpen || mobileMenuOpen) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => {
            setDropdownOpen(false);
            setMobileMenuOpen(false);
          }}
        />
      )}
      
      {/* Add a spacer to prevent content from going under the fixed navbar */}
      <div className={`h-${scrolled ? '16' : '20'}`}></div>
    </>
  );
}
