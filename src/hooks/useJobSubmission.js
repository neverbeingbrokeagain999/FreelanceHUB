import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const validateJob = (jobDetails, user) => {
  if (user?.role !== 'client') {
    return 'Only clients can post jobs';
  }

  if (!jobDetails.requirements || jobDetails.requirements.trim() === '') {
    return 'Please provide job requirements';
  }

  const requiredFields = [
    'title', 'description', 'type', 
    'duration', 'experienceLevel', 'skills'
  ];
  
  for (const field of requiredFields) {
    if (!jobDetails[field] || jobDetails[field].trim() === '') {
      return `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
    }
  }

  if (!jobDetails.category?.main || jobDetails.category.main.trim() === '') {
    return 'Please select a category';
  }

  if (!jobDetails.budget?.type) {
    return 'Please select a budget type';
  }

  const min = parseInt(jobDetails.budget?.min);
  if (isNaN(min) || min <= 0) {
    return 'Please provide a valid minimum budget (greater than 0)';
  }

  const max = parseInt(jobDetails.budget?.amount);
  if (jobDetails.budget.amount && (isNaN(max) || max <= min)) {
    return 'Maximum budget must be greater than minimum budget';
  }

  return null;
};

export const useJobSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const submitJob = async (jobDetails, estimatedCost, selectedTemplate) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to post a job');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Clean and validate fields
      const title = jobDetails.title.trim();
      const description = jobDetails.description.trim();
      const requirements = jobDetails.requirements.trim();
      const category = jobDetails.category.main.trim();
      const skills = jobDetails.skills.split(',').map(s => s.trim()).filter(s => s);
      const min = Number(jobDetails.budget.min);
      const max = Number(jobDetails.budget.max || jobDetails.budget.amount || estimatedCost || min);

      // Ensure valid numbers
      if (isNaN(min) || min <= 0) {
        throw new Error('Invalid minimum budget amount');
      }
      
      if (isNaN(max) || max < min) {
        throw new Error('Maximum budget must be greater than or equal to minimum budget');
      }

      const payload = {
        title,
        description,
        requirements,
        category: { main: category },
        skills,
        budget: {
          type: jobDetails.budget.type,
          min,
          max,
          currency: 'USD'
        },
        type: jobDetails.type,
        duration: jobDetails.duration,
        experienceLevel: jobDetails.experienceLevel,
        location: { type: 'remote' },
        status: 'published'
      };

      console.log('Submitting job payload:', payload);

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to post job');
      }

      console.log('Job posted successfully:', data);
      navigate('/client/dashboard');
    } catch (error) {
      console.error('Failed to post job:', error);
      setError(error.message || 'An error occurred while posting the job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitJob,
    isSubmitting,
    error,
    setError,
    validateJob
  };
};
