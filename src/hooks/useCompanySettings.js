import { useState, useEffect } from 'react';

export const useCompanySettings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [has2FAEnabled, setHas2FAEnabled] = useState(false);
  const [companyData, setCompanyData] = useState({
    companyName: '',
    industry: '',
    size: '',
    website: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    notificationPreferences: {
      emailAlerts: true,
      jobApplications: true,
      messages: true,
      projectUpdates: true
    }
  });

  const fetch2FAStatus = async () => {
    try {
      const response = await fetch('/api/auth/2fa/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHas2FAEnabled(data.enabled);
      }
    } catch (err) {
      console.error('Error fetching 2FA status:', err);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/company-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch company settings');
      }

      const data = await response.json();
      setCompanyData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching company settings:', err);
      setError('Failed to load company settings. Please try again later.');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCompanyData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setCompanyData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setCompanyData(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [name]: checked
      }
    }));
  };

  const saveCompanySettings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/company-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        throw new Error('Failed to update company settings');
      }

      setSuccess('Company settings updated successfully');
    } catch (err) {
      console.error('Error updating company settings:', err);
      setError('Failed to update company settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanySettings();
    fetch2FAStatus();
  }, []);

  return {
    loading,
    error,
    success,
    has2FAEnabled,
    companyData,
    handleInputChange,
    handleNotificationChange,
    saveCompanySettings,
    setError,
    setSuccess
  };
};
