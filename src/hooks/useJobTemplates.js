import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

// Default templates that will be shown if API fails
const defaultTemplates = [
  {
    _id: 'default-1',
    name: 'Website Development',
    description: 'Full website development project including frontend and backend',
    category: 'Web Development',
    skills: ['React', 'Node.js', 'MongoDB'],
    budget: {
      min: 1000,
      max: 5000
    }
  },
  {
    _id: 'default-2',
    name: 'Mobile App Development',
    description: 'Native mobile application for iOS and Android',
    category: 'Mobile Development',
    skills: ['React Native', 'iOS', 'Android'],
    budget: {
      min: 2000,
      max: 8000
    }
  },
  {
    _id: 'default-3',
    name: 'UI/UX Design',
    description: 'Complete user interface and experience design',
    category: 'Design',
    skills: ['Figma', 'Adobe XD', 'UI/UX'],
    budget: {
      min: 500,
      max: 3000
    }
  }
];

export const useJobTemplates = () => {
  const [templates, setTemplates] = useState(defaultTemplates);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();

  useEffect(() => {
    const fetchTemplates = async () => {
      // Don't fetch if not authenticated
      if (!token || !user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/project-templates', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include' // Include cookies for cross-origin requests
        });

        if (response.ok) {
          const data = await response.json();
          // Check if data is an array or if it's wrapped in a property
          const templateData = Array.isArray(data) ? data : data.projectTemplates || data.templates;
          
          if (Array.isArray(templateData) && templateData.length > 0) {
            // Ensure each template has a unique _id
            const processedTemplates = templateData.map(template => ({
              ...template,
              _id: template._id || template.id || `template-${Math.random()}`
            }));
            setTemplates(processedTemplates);
          } else {
            console.log('No templates returned from API, using defaults');
            setTemplates(defaultTemplates);
          }
        } else if (response.status === 401) {
          console.log('Authentication required for templates');
          setError('Please log in to access templates');
          setTemplates(defaultTemplates);
        } else {
          const errorData = await response.json().catch(() => null);
          console.warn('Failed to fetch templates:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          setError(errorData?.message || 'Failed to fetch templates');
          setTemplates(defaultTemplates);
        }
      } catch (error) {
        console.warn('Error fetching templates:', error);
        setError('Error loading templates. Using default templates.');
        setTemplates(defaultTemplates);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [token, user]);

  return { templates, error, loading };
};
