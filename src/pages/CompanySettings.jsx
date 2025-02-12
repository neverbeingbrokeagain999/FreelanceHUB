import React from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCompanySettings } from '../hooks/useCompanySettings';
import {
  SecuritySection,
  CompanyInformation,
  AddressSection,
  NotificationPreferences,
} from '../components/company-settings';

function CompanySettings() {
  const {
    loading,
    error,
    success,
    has2FAEnabled,
    companyData,
    handleInputChange,
    handleNotificationChange,
    saveCompanySettings,
  } = useCompanySettings();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <form onSubmit={(e) => {
            e.preventDefault();
            saveCompanySettings();
          }} className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Company Settings</h1>

            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-md">
                {success}
              </div>
            )}

            <SecuritySection has2FAEnabled={has2FAEnabled} />
            
            <CompanyInformation 
              companyData={companyData}
              handleInputChange={handleInputChange}
            />

            <AddressSection 
              companyData={companyData}
              handleInputChange={handleInputChange}
            />

            <NotificationPreferences 
              companyData={companyData}
              handleNotificationChange={handleNotificationChange}
            />

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CompanySettings;
