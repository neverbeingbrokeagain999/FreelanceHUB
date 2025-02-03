import React, { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';

    function PostJob() {
      const [jobDetails, setJobDetails] = useState({
        title: '',
        description: '',
        budget: '',
        category: '',
        skills: '',
      });
      const [templates, setTemplates] = useState([]);
      const [selectedTemplate, setSelectedTemplate] = useState('');
      const [estimatedCost, setEstimatedCost] = useState(0);
      const [complexity, setComplexity] = useState('medium');
      const [estimatedHours, setEstimatedHours] = useState(10);
      const navigate = useNavigate();

      useEffect(() => {
        const fetchTemplates = async () => {
          try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/project-templates', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (response.ok) {
              const data = await response.json();
              setTemplates(data);
            } else {
              console.error('Failed to fetch project templates:', response.statusText);
            }
    
      const handleCategoryChange = (e) => {
        setJobDetails({ ...jobDetails, category: { main: e.target.value } });
      };
      
      const handleBudgetTypeChange = (e) => {
        setJobDetails({ ...jobDetails, budget: { ...jobDetails.budget, type: e.target.value } });
      };
      
      const handleBudgetMinChange = (e) => {
        setJobDetails({ ...jobDetails, budget: { ...jobDetails.budget, min: parseInt(e.target.value) } });
      };
          } catch (error) {
            console.error('Error fetching project templates:', error);
          }
        };

        fetchTemplates();
      }, []);

      const handleChange = (e) => {
        setJobDetails({ ...jobDetails, [e.target.name]: e.target.value });
      };

      const handleTemplateChange = (e) => {
        const templateId = e.target.value;
        setSelectedTemplate(templateId);
        const selected = templates.find(template => template._id === templateId);
        if (selected) {
          setJobDetails({
            title: selected.name,
            description: selected.description,
            budget: selected.budget || '',
            category: selected.category,
            skills: selected.skills.join(', '),
          });
        } else {
          setJobDetails({
            title: '',
            description: '',
            budget: '',
            category: '',
            skills: '',
          });
        }
      };

      const handleComplexityChange = (e) => {
        setComplexity(e.target.value);
        calculateEstimatedCost();
      };

      const handleHoursChange = (e) => {
        setEstimatedHours(parseInt(e.target.value));
        calculateEstimatedCost();
      };

      const calculateEstimatedCost = () => {
        let baseRate = 50;
        if (complexity === 'low') baseRate = 30;
        if (complexity === 'high') baseRate = 70;
        const cost = baseRate * estimatedHours;
        setEstimatedCost(cost);
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:5000/api/jobs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              ...jobDetails,
              skills: jobDetails.skills.split(',').map(skill => skill.trim()).filter(skill => skill !== ''),
              templateId: selectedTemplate || null,
              budget: jobDetails.budget || estimatedCost,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Job posted successfully:', data);
            navigate(`/job/${data.job._id}`);
          } else {
            console.error('Failed to post job:', response.statusText);
          }
        } catch (error) {
          console.error('Error posting job:', error);
        }
      };

      return (
        <div className="min-h-screen bg-light py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-dark mb-4 font-serif">Post a Job</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Describe your project and start receiving proposals from top freelancers.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm">
              <div className="mb-6">
                <label htmlFor="template" className="block text-gray-700 text-sm font-bold mb-2">Use a Template</label>
                <select
                  id="template"
                  name="template"
                  value={selectedTemplate}
                  onChange={handleTemplateChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select a template</option>
                  <option value="no-template">No Template</option>
                  {templates.map(template => (
                    <option key={template._id} value={template._id}>{template.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Job Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={jobDetails.title}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={jobDetails.description}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="5"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">Category</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={jobDetails.category}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="skills" className="block text-gray-700 text-sm font-bold mb-2">Skills Required</label>
                <input
                  type="text"
                  id="skills"
                  name="skills"
                  value={jobDetails.skills}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="e.g., React, Node.js, UI/UX"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="type" className="block text-gray-700 text-sm font-bold mb-2">Job Type</label>
                <select
                  id="type"
                  name="type"
                  value={jobDetails.type}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Job Type</option>
                  <option value="fixed">Fixed</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
              <div className="mb-6">
                <label htmlFor="duration" className="block text-gray-700 text-sm font-bold mb-2">Job Duration</label>
                <select
                  id="duration"
                  name="duration"
                  value={jobDetails.duration}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Job Duration</option>
                  <option value="less_than_1_month">Less than 1 month</option>
                  <option value="1_to_3_months">1 to 3 months</option>
                  <option value="3_to_6_months">3 to 6 months</option>
                  <option value="more_than_6_months">More than 6 months</option>
                </select>
              </div>
              <div className="mb-6">
                <label htmlFor="experienceLevel" className="block text-gray-700 text-sm font-bold mb-2">Experience Level</label>
                <select
                  id="experienceLevel"
                  name="experienceLevel"
                  value={jobDetails.experienceLevel}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Experience Level</option>
                  <option value="entry">Entry</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div className="mb-6">
                <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">Category</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={jobDetails.category?.main}
                  onChange={handleCategoryChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2 font-serif">Budget Estimator</h3>
                <div className="mb-2">
                  <label htmlFor="complexity" className="block text-gray-700 text-sm font-bold mb-2">Complexity</label>
                  <select
                    id="complexity"
                    name="complexity"
                    value={complexity}
                    onChange={handleComplexityChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label htmlFor="estimatedHours" className="block text-gray-700 text-sm font-bold mb-2">Estimated Hours</label>
                  <input
                    type="number"
                    id="estimatedHours"
                    name="estimatedHours"
                    value={estimatedHours}
                    onChange={handleHoursChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="mt-4">
                  <p className="text-gray-700">Estimated Cost: ${estimatedCost}</p>
                </div>
              </div>
              <div className="mb-6">
                <label htmlFor="budgetType" className="block text-gray-700 text-sm font-bold mb-2">Budget Type</label>
                <select
                  id="budgetType"
                  name="budgetType"
                  value={jobDetails.budget?.type}
                  onChange={handleBudgetTypeChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Budget Type</option>
                  <option value="fixed">Fixed</option>
                  <option value="range">Range</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
              <div className="mb-6">
                <label htmlFor="budgetMin" className="block text-gray-700 text-sm font-bold mb-2">Minimum Budget</label>
                <input
                  type="number"
                  id="budgetMin"
                  name="budgetMin"
                  value={jobDetails.budget?.min}
                  onChange={handleBudgetMinChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter minimum budget"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="budget" className="block text-gray-700 text-sm font-bold mb-2">Budget</label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={jobDetails.budget}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter your budget or use the estimated cost"
                />
              </div>
              <div className="text-center">
                <button type="submit" className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-secondary transition">
                  Post Job
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    export default PostJob;
