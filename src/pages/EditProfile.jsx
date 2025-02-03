import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

const FormField = ({ label, type = 'text', value, onChange, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {type === 'textarea' ? (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={4}
        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
        {...props}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
        {...props}
      />
    )}
  </div>
);

export default function EditProfile() {
  const { user, setUser } = useAuthContext();
  const { addSuccess, addError } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  // Get initial form state based on user role
  const getInitialFormState = (role) => {
    const commonFields = {
      name: '',
      email: '',
      bio: ''
    };

    return role === 'client' 
      ? {
          ...commonFields,
          companyName: '',
          industry: '',
          companySize: '',
          website: ''
        }
      : {
          ...commonFields,
          title: '',
          location: '',
          skills: [],
          hourlyRate: ''
        };
  };

  const [formData, setFormData] = useState(getInitialFormState(user?.role));

  useEffect(() => {
    if (!user?._id) return;
    
    let isMounted = true;
    const fetchProfile = async (retryCount = 0) => {
      if (isMounted) {
        setLoading(true);
      }
      
      const maxRetries = 3;
      const retryDelay = 1000; // 1 second
      // Get endpoint based on user role
      const endpoint = user.role === 'client'
        ? `/api/users/client/profile/${user._id}`
        : `/api/users/freelancer/${user._id}`;

      try {
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.status === 429 && retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
          return fetchProfile(retryCount + 1);
        }
        
        if (response.status === 429) {
          throw new Error('Too many requests. Please try again in a moment.');
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }
        
        const data = await response.json();

        // Only include relevant fields based on role
        const commonData = {
          name: data.name || user.name || '',
          email: data.email || user.email || '',
          bio: data.bio || ''
        };

        const roleSpecificData = user.role === 'client'
          ? {
              companyName: data.companyName || '',
              industry: data.industry || '',
              companySize: data.companySize || '',
              website: data.website || ''
            }
          : {
              title: data.title || '',
              location: data.location || '',
              skills: data.skills || [],
              hourlyRate: data.hourlyRate || ''
            };

        if (isMounted) {
          setFormData({ ...commonData, ...roleSpecificData });
          setImagePreview(data.profilePicture || '/default-avatar.png');
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching profile:', error);
          addError(error.message || 'Failed to load profile data');
          setLoading(false);
        }
      }
    };

    fetchProfile();
    
    return () => {
      isMounted = false;
    };
  }, [user, addError]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addError('Image size should be less than 5MB');
      return;
    }
    
    setProfileImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formPayload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formPayload.append(key, JSON.stringify(value));
        } else {
          formPayload.append(key, value);
        }
      });

      if (profileImage) {
        formPayload.append('profilePicture', profileImage);
      }

      const endpoint = user.role === 'client' ? '/api/users/client/profile' : '/api/users/freelancer/profile';
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: formPayload
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const { profile } = await response.json();
      setUser(profile.user);
      addSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Error:', error);
      addError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Profile</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center space-x-6">
              <div className="shrink-0">
                <img
                  className="h-32 w-32 object-cover rounded-full border-4 border-primary"
                  src={imagePreview}
                  alt="Profile"
                />
              </div>
              <label className="block">
                <span className="sr-only">Choose profile photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-white
                    hover:file:bg-primary-dark"
                />
              </label>
            </div>

            {/* Common Fields */}
            <FormField 
              label="Name" 
              value={formData.name} 
              onChange={(value) => updateFormData('name', value)} 
            />
            <FormField 
              label="Email" 
              type="email" 
              value={formData.email} 
              onChange={(value) => updateFormData('email', value)} 
            />
            <FormField 
              label="Bio" 
              type="textarea" 
              value={formData.bio} 
              onChange={(value) => updateFormData('bio', value)} 
            />

            {/* Conditional Fields */}
            {user?.role === 'client' ? (
              <>
                <FormField 
                  label="Company Name" 
                  value={formData.companyName} 
                  onChange={(value) => updateFormData('companyName', value)} 
                />
                <FormField 
                  label="Industry" 
                  value={formData.industry} 
                  onChange={(value) => updateFormData('industry', value)} 
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Size</label>
                  <select
                    value={formData.companySize}
                    onChange={e => updateFormData('companySize', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
                  >
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501+">501+ employees</option>
                  </select>
                </div>
                <FormField 
                  label="Company Website" 
                  type="url" 
                  value={formData.website} 
                  onChange={(value) => updateFormData('website', value)} 
                  placeholder="https://example.com"
                />
              </>
            ) : (
              <>
                <FormField 
                  label="Professional Title" 
                  value={formData.title} 
                  onChange={(value) => updateFormData('title', value)} 
                  placeholder="e.g. Full Stack Developer"
                />
                <FormField 
                  label="Skills" 
                  value={formData.skills.join(', ')} 
                  onChange={(value) => updateFormData('skills', value.split(',').map(s => s.trim()).filter(Boolean))} 
                  placeholder="Separate skills with commas"
                />
                <FormField 
                  label="Hourly Rate ($)" 
                  type="number" 
                  value={formData.hourlyRate} 
                  onChange={(value) => updateFormData('hourlyRate', value)} 
                />
                <FormField 
                  label="Location" 
                  value={formData.location} 
                  onChange={(value) => updateFormData('location', value)} 
                />
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
