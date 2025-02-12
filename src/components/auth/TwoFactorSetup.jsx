import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import LoadingSpinner from '../LoadingSpinner';

const TwoFactorSetup = ({ onComplete }) => {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generate2FA = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/2fa/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to generate 2FA');
        }

        const data = await response.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
      } catch (err) {
        setError(err.message);
        toast.error('Failed to generate 2FA setup');
      } finally {
        setLoading(false);
      }
    };

    generate2FA();
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      setError('Please enter verification code');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: verificationCode,
          secret
        })
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      toast.success('Two-factor authentication enabled successfully');
      onComplete?.();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !qrCode) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Setup Two-Factor Authentication
      </h2>

      <div className="space-y-6">
        {/* Instructions */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            1. Scan QR Code
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Open your authenticator app and scan the QR code below, or manually enter the secret key.
          </p>
          {qrCode && (
            <div className="flex flex-col items-center space-y-4">
              <img
                src={qrCode}
                alt="QR Code"
                className="border border-gray-200 rounded p-2"
              />
              <div className="text-sm text-gray-500 font-mono bg-gray-50 p-2 rounded break-all">
                {secret}
              </div>
            </div>
          )}
        </div>

        {/* Verification form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              2. Enter Verification Code
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the 6-digit code from your authenticator app to verify setup.
            </p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => {
                setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError(null);
              }}
              placeholder="000000"
              className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              maxLength={6}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || verificationCode.length !== 6}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <LoadingSpinner size="sm" variant="white" /> : 'Verify and Enable'}
          </button>
        </form>

        {/* Recovery codes notice */}
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded">
          <p className="font-medium text-gray-900 mb-2">
            Important:
          </p>
          <p>
            After verification, you'll receive recovery codes. Store them safely - they're needed if you lose access to your authenticator app.
          </p>
        </div>
      </div>
    </div>
  );
};

TwoFactorSetup.propTypes = {
  onComplete: PropTypes.func
};

export default TwoFactorSetup;
