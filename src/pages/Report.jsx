import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Report() {
  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    description: '',
    urgency: 'medium',
    email: '',
    attachments: [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Report submission logic will be implemented
    console.log('Report submitted:', formData);
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        attachments: Array.from(files)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="min-h-screen bg-light py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Report an Issue</h1>
            <p className="text-xl text-gray-600">Our trust & safety team will review your report</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Type *
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="">Select issue type</option>
                  <option value="fraud">Fraud or Scam</option>
                  <option value="harassment">Harassment</option>
                  <option value="ip">Intellectual Property Violation</option>
                  <option value="payment">Payment Issue</option>
                  <option value="quality">Quality Concerns</option>
                  <option value="technical">Technical Problem</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  placeholder="Brief description of the issue"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={formData.subject}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={6}
                  placeholder="Please provide as much detail as possible about the issue"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency Level *
                </label>
                <select
                  id="urgency"
                  name="urgency"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={formData.urgency}
                  onChange={handleChange}
                >
                  <option value="low">Low - Can be addressed in due course</option>
                  <option value="medium">Medium - Requires attention soon</option>
                  <option value="high">High - Urgent attention needed</option>
                  <option value="critical">Critical - Immediate action required</option>
                </select>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="Where we can reach you about this report"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none"
                      >
                        <span>Upload files</span>
                        <input
                          id="file-upload"
                          name="attachments"
                          type="file"
                          multiple
                          className="sr-only"
                          onChange={handleChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB each</p>
                  </div>
                </div>
                {formData.attachments.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {formData.attachments.map((file, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        {file.name} ({Math.round(file.size / 1024)} KB)
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="text-sm text-gray-600">
                By submitting this report, you agree to our{' '}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                . We take all reports seriously and will investigate thoroughly.
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white font-medium py-3 px-6 rounded-lg hover:bg-primary-dark transition"
                >
                  Submit Report
                </button>
                <Link
                  to="/support"
                  className="flex-1 bg-white text-primary font-medium py-3 px-6 rounded-lg border-2 border-primary hover:bg-primary/5 text-center transition"
                >
                  Contact Support Instead
                </Link>
              </div>
            </form>
          </div>

          <div className="mt-8 text-center text-gray-600">
            <p>For immediate assistance, please call our 24/7 support line:</p>
            <p className="font-semibold">1-800-FREELANCE</p>
          </div>
        </div>
      </div>
    </div>
  );
}
