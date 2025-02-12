import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useJobTemplates } from '../hooks/useJobTemplates';
import { useJobSubmission } from '../hooks/useJobSubmission';
import { BudgetEstimator } from '../components/BudgetEstimator';
import { calculateEstimatedCost, COMPLEXITY_OPTIONS } from '../utils/budgetCalculator';
import LoadingSpinner from '../components/LoadingSpinner';

function PostJob() {
  const { user } = useAuth();
  const { templates, error: templateError } = useJobTemplates();
  const { submitJob, isSubmitting, error: submitError, setError, validateJob } = useJobSubmission();

  const [jobDetails, setJobDetails] = useState({
    title: '',
    description: '',
    requirements: '',
    budget: { type: '', min: '', amount: '' },
    category: { main: '' },
    skills: '',
    type: '',
    duration: '',
    experienceLevel: ''
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [complexity, setComplexity] = useState(COMPLEXITY_OPTIONS.MEDIUM);
  const [estimatedHours, setEstimatedHours] = useState(10);
  const [estimatedCost, setEstimatedCost] = useState(() => 
    calculateEstimatedCost(COMPLEXITY_OPTIONS.MEDIUM, 10)
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'budget') {
      setJobDetails({
        ...jobDetails,
        budget: { ...jobDetails.budget, amount: value ? parseInt(value) : '' }
      });
    } else if (name === 'budgetType') {
      setJobDetails({
        ...jobDetails,
        budget: { ...jobDetails.budget, type: value }
      });
    } else if (name === 'budgetMin') {
      setJobDetails({
        ...jobDetails,
        budget: { ...jobDetails.budget, min: value ? parseInt(value) : '' }
      });
    } else if (name === 'category') {
      setJobDetails({
        ...jobDetails,
        category: { main: value }
      });
    } else {
      setJobDetails({ ...jobDetails, [name]: value });
    }
    setError(null);
  };

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);
    if (templateId === '' || templateId === 'no-template') {
      setJobDetails({
        title: '',
        description: '',
        requirements: '',
        budget: { type: '', min: '', amount: '' },
        category: { main: '' },
        skills: '',
        type: '',
        duration: '',
        experienceLevel: ''
      });
    } else {
      const selected = templates.find(t => t._id === templateId);
      if (selected) {
        setJobDetails({
          title: selected.name,
          description: selected.description,
          requirements: selected.requirements || '',
          budget: {
            type: selected.budget?.type || '',
            min: selected.budget?.min || '',
            amount: selected.budget?.amount || ''
          },
          category: { main: selected.category?.main || '' },
          skills: selected.skills?.join(', ') || '',
          type: selected.type || '',
          duration: selected.duration || '',
          experienceLevel: selected.experienceLevel || ''
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationError = validateJob(jobDetails, user);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await submitJob(jobDetails, estimatedCost, selectedTemplate);
    } catch (error) {
      setError(error.message || 'Failed to submit job');
    }
  };

  console.log('User object:', user); // Debug log
  console.log('User roles:', user?.roles); // Debug log
  
  // Check if user has client role (case-insensitive)
  const hasClientRole = user?.roles?.some(role => role.toLowerCase() === 'client');
  if (!hasClientRole) {
    return (
      <div className="min-h-screen bg-light py-20">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p>Only clients can post jobs. Please switch to a client account.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-dark mb-4">Post a Job</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Describe your project and start receiving proposals.
          </p>
        </div>

        {(templateError || submitError) && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {templateError || submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm">
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Template</label>
            <select
              name="template"
              value={selectedTemplate}
              onChange={handleTemplateChange}
              className="w-full border rounded px-3 py-2"
              disabled={isSubmitting}
            >
              <option value="">Select a template</option>
              <option value="no-template">No template</option>
              {templates?.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Title</label>
            <input
              name="title"
              value={jobDetails.title}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
            <textarea
              name="description"
              value={jobDetails.description}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              rows="4"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Requirements</label>
            <textarea
              name="requirements"
              value={jobDetails.requirements}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              rows="4"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Category</label>
            <input
              name="category"
              value={jobDetails.category.main}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Skills (comma-separated)</label>
            <input
              name="skills"
              value={jobDetails.skills}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Job Type</label>
            <select
              name="type"
              value={jobDetails.type}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={isSubmitting}
            >
              <option value="">Select type</option>
              <option value="fixed">Fixed</option>
              <option value="hourly">Hourly</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Duration</label>
            <select
              name="duration"
              value={jobDetails.duration}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={isSubmitting}
            >
              <option value="">Select duration</option>
              <option value="less_than_1_month">Less than 1 month</option>
              <option value="1_to_3_months">1 to 3 months</option>
              <option value="3_to_6_months">3 to 6 months</option>
              <option value="more_than_6_months">More than 6 months</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Experience Level</label>
            <select
              name="experienceLevel"
              value={jobDetails.experienceLevel}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={isSubmitting}
            >
              <option value="">Select level</option>
              <option value="entry">Entry</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <BudgetEstimator
            complexity={complexity}
            estimatedHours={estimatedHours}
            estimatedCost={estimatedCost}
            onComplexityChange={(e) => {
              const newComplexity = e.target.value;
              setComplexity(newComplexity);
              setEstimatedCost(calculateEstimatedCost(newComplexity, estimatedHours));
            }}
            onHoursChange={(e) => {
              const hours = e.target.value ? parseInt(e.target.value) : 0;
              setEstimatedHours(hours);
              setEstimatedCost(calculateEstimatedCost(complexity, hours));
            }}
            disabled={isSubmitting}
          />

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Budget Type</label>
            <select
              name="budgetType"
              value={jobDetails.budget.type}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={isSubmitting}
            >
              <option value="">Select type</option>
              <option value="fixed">Fixed</option>
              <option value="range">Range</option>
              <option value="hourly">Hourly</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Minimum Budget</label>
            <input
              type="number"
              name="budgetMin"
              value={jobDetails.budget.min}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={isSubmitting}
              min="1"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Maximum Budget</label>
            <input
              type="number"
              name="budget"
              value={jobDetails.budget.amount}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={isSubmitting}
              min="1"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? <LoadingSpinner /> : 'Post Job'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PostJob;
