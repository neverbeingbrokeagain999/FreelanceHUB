import React, { useState, useEffect } from 'react';
    import { toast, ToastContainer } from 'react-toastify';
    import 'react-toastify/dist/ReactToastify.css';
    import { io } from 'socket.io-client';

    function JobAlerts() {
      const [keywords, setKeywords] = useState('');
      const [categories, setCategories] = useState('');
      const [minBudget, setMinBudget] = useState('');
      const [maxBudget, setMaxBudget] = useState('');
      const [location, setLocation] = useState('');
      const [socket, setSocket] = useState(null);

      useEffect(() => {
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        return () => {
          newSocket.disconnect();
        };
      }, []);

      useEffect(() => {
        if (!socket) return;

        socket.on('newJobAlert', (data) => {
          if (data.userId === localStorage.getItem('userId')) {
            toast.info(`New job posted: ${data.job.title}`, {
              position: toast.POSITION.TOP_RIGHT,
            });
          }
        });

        return () => {
          socket.off('newJobAlert');
        };
      }, [socket]);

      useEffect(() => {
        const fetchJobAlert = async () => {
          try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/job-alerts', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (response.ok) {
              const data = await response.json();
              if (data) {
                setKeywords(data.keywords ? data.keywords.join(', ') : '');
                setCategories(data.categories ? data.categories.join(', ') : '');
                setMinBudget(data.minBudget || '');
                setMaxBudget(data.maxBudget || '');
                setLocation(data.location || '');
              }
            } else {
              console.error('Failed to fetch job alert:', response.statusText);
            }
          } catch (error) {
            console.error('Error fetching job alert:', error);
          }
        };

        fetchJobAlert();
      }, []);

      const handleSubmit = async (e) => {
        e.preventDefault();
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/job-alerts', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              keywords: keywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword !== ''),
              categories: categories.split(',').map(category => category.trim()).filter(category => category !== ''),
              minBudget: minBudget ? parseFloat(minBudget) : null,
              maxBudget: maxBudget ? parseFloat(maxBudget) : null,
              location: location,
            }),
          });
          if (response.ok) {
            console.log('Job alert updated successfully');
            toast.success('Job alert updated successfully', {
              position: toast.POSITION.TOP_RIGHT,
            });
          } else {
            console.error('Failed to update job alert:', response.statusText);
            toast.error('Failed to update job alert', {
              position: toast.POSITION.TOP_RIGHT,
            });
          }
        } catch (error) {
          console.error('Error updating job alert:', error);
          toast.error('Error updating job alert', {
            position: toast.POSITION.TOP_RIGHT,
          });
        }
      };

      const handleDelete = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/job-alerts', {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            console.log('Job alert deleted successfully');
            setKeywords('');
            setCategories('');
            setMinBudget('');
            setMaxBudget('');
            setLocation('');
            toast.success('Job alert deleted successfully', {
              position: toast.POSITION.TOP_RIGHT,
            });
          } else {
            console.error('Failed to delete job alert:', response.statusText);
            toast.error('Failed to delete job alert', {
              position: toast.POSITION.TOP_RIGHT,
            });
          }
        } catch (error) {
          console.error('Error deleting job alert:', error);
          toast.error('Error deleting job alert', {
            position: toast.POSITION.TOP_RIGHT,
          });
        }
      };

      return (
        <div className="min-h-screen bg-light py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-dark mb-4 font-serif">Job Alerts</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Set up alerts to get notified when new jobs matching your criteria are posted.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm">
              <div className="mb-6">
                <label htmlFor="keywords" className="block text-gray-700 text-sm font-bold mb-2">Keywords</label>
                <input
                  type="text"
                  id="keywords"
                  name="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="e.g., React, Node.js, UI/UX"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="categories" className="block text-gray-700 text-sm font-bold mb-2">Categories</label>
                <input
                  type="text"
                  id="categories"
                  name="categories"
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="e.g., Web Development, Mobile App, Design"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="minBudget" className="block text-gray-700 text-sm font-bold mb-2">Minimum Budget</label>
                <input
                  type="number"
                  id="minBudget"
                  name="minBudget"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="e.g., 100"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="maxBudget" className="block text-gray-700 text-sm font-bold mb-2">Maximum Budget</label>
                <input
                  type="number"
                  id="maxBudget"
                  name="maxBudget"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="e.g., 1000"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="location" className="block text-gray-700 text-sm font-bold mb-2">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="e.g., Remote, New York, London"
                />
              </div>
              <div className="text-center">
                <button type="submit" className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-secondary transition mr-2">
                  Save Alert
                </button>
                <button type="button" onClick={handleDelete} className="bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition">
                  Delete Alert
                </button>
              </div>
            </form>
          </div>
          <ToastContainer />
        </div>
      );
    }

    export default JobAlerts;
