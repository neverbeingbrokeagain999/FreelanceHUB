import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '../hooks/useAuth';

/**
 * Main navigation component
 * @returns {JSX.Element} Navbar component
 */
const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  // Role-based navigation items
  const getNavItems = () => {
    if (!user?.roles) return [];

    if (user.roles.includes('admin')) {
      return [
        { label: 'Dashboard', href: '/admin/dashboard' },
        { label: 'Jobs', href: '/admin/jobs' },
        { label: 'Disputes', href: '/admin/disputes' },
        { label: 'Verify Profiles', href: '/admin/verify-profiles' }
      ];
    }
    
    if (user.roles.includes('freelancer')) {
      return [
        { label: 'Find Work', href: '/freelancer/browse-jobs' },
        { label: 'My Jobs', href: '/freelancer/active-jobs' },
        { label: 'Messages', href: '/freelancer/messages' },
        { label: 'Notifications', href: '/freelancer/notifications' }
      ];
    }
    
    if (user.roles.includes('client')) {
      return [
        { label: 'Post Job', href: '/client/post-job' },
        { label: 'My Jobs', href: '/client/active-jobs' },
        { label: 'Messages', href: '/client/messages' },
        { label: 'Notifications', href: '/client/notifications' }
      ];
    }

    return [];
  };

  const getUserMenuItems = () => {
    if (!user?.roles) return [];

    if (user.roles.includes('admin')) {
      return [
        { label: 'Dashboard', href: '/admin/dashboard' },
        { label: 'Settings', href: '/admin/settings' }
      ];
    }

    if (user.roles.includes('freelancer')) {
      return [
        { label: 'Dashboard', href: '/freelancer/dashboard' },
        { label: 'Profile', href: '/freelancer/profile' },
        { label: 'Settings', href: '/freelancer/settings' }
      ];
    }

    if (user.roles.includes('client')) {
      return [
        { label: 'Dashboard', href: '/client/dashboard' },
        { label: 'Settings', href: '/client/settings' }
      ];
    }

    return [];
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img className="h-8 w-auto" src="/logo.png" alt="Logo" />
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {isAuthenticated && getNavItems().map((item, index) => (
                <Link 
                  key={index}
                  to={item.href}
                  className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-primary-500"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <Menu as="div" className="ml-3 relative">
                <Menu.Button className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <span className="sr-only">Open user menu</span>
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user?.avatar || '/default-avatar.png'}
                    alt="User avatar"
                  />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {getUserMenuItems().map((item) => (
                      <Menu.Item key={item.href}>
                        {({ active }) => (
                          <Link
                            to={item.href}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } block px-4 py-2 text-sm text-gray-700`}
                          >
                            {item.label}
                          </Link>
                        )}
                      </Menu.Item>
                    ))}
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                        >
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-900 hover:text-primary-600"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
