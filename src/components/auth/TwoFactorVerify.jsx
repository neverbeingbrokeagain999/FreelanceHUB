import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import LoadingSpinner from '../LoadingSpinner';

const TwoFactorVerify = ({ onVerify, onCancel }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRecovery, setShowRecovery] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Please enter verification code');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/2fa/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: code,
          isRecoveryCode: showRecovery
        })
      });

      if (!response.ok) {
        throw new Error(showRecovery ? 'Invalid recovery code' : 'Invalid verification code');
      }

      const data = await response.json();
      onVerify(data.token);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecovery = () => {
    setShowRecovery(!showRecovery);
    setCode('');
    setError(null);
  };

  return (
    <div className="max-w-md w-full space-y-8 p-6 bg-white rounded-lg shadow">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Two-Factor Authentication
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {showRecovery 
            ? 'Enter a recovery code from your backup codes'
            : 'Enter the verification code from your authenticator app'}
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <label htmlFor="code" className="sr-only">
              {showRecovery ? 'Recovery Code' : 'Verification Code'}
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\s/g, '');
                setCode(showRecovery ? value : value.replace(/\D/g, '').slice(0, 6));
                setError(null);
              }}
              className={`appearance-none rounded relative block w-full px-3 py-2 border text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={showRecovery ? 'Enter recovery code' : '000000'}
              maxLength={showRecovery ? 24 : 6}
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={toggleRecovery}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            {showRecovery 
              ? 'Use authenticator app instead'
              : 'Use recovery code'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-medium text-gray-600 hover:text-gray-500"
          >
            Cancel
          </button>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || (showRecovery ? code.length < 8 : code.length !== 6)}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <LoadingSpinner size="sm" variant="white" />
            ) : (
              'Verify'
            )}
          </button>
        </div>
      </form>

      <div className="text-sm text-center">
        <p className="text-gray-600">
          Having trouble? Contact{' '}
          <a href="/support" className="font-medium text-blue-600 hover:text-blue-500">
            support
          </a>
        </p>
      </div>
    </div>
  );
};

TwoFactorVerify.propTypes = {
  onVerify: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default TwoFactorVerify;
