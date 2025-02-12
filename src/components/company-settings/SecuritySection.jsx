import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key } from '../../components/icons';

export const SecuritySection = ({ has2FAEnabled }) => {
  const navigate = useNavigate();

  const handle2FASetup = () => {
    if (has2FAEnabled) {
      if (window.confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
        navigate('/security/2fa-setup?action=disable');
      }
    } else {
      navigate('/security/2fa-setup');
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Shield className="h-5 w-5 mr-2" />
        Security Settings
      </h2>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-start">
            <div className="flex items-center">
              <Key className="h-5 w-5 text-gray-400 mr-3" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500">
                {has2FAEnabled 
                  ? 'Two-factor authentication is enabled for your account.'
                  : 'Add an extra layer of security to your account.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handle2FASetup}
            className={`ml-4 inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
              has2FAEnabled 
                ? 'border-red-300 text-red-700 bg-white hover:bg-red-50 focus:ring-red-500'
                : 'border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            {has2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </button>
        </div>
      </div>
    </div>
  );
};
