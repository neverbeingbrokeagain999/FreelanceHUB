import React, { useState, useEffect } from 'react';

    function DirectContracts() {
      const [contracts, setContracts] = useState([]);
      const [newContract, setNewContract] = useState({
        client: '',
        contractDetails: '',
        startDate: '',
        endDate: '',
        budget: '',
      });
      const [loading, setLoading] = useState(true);
      const [showForm, setShowForm] = useState(false);

      useEffect(() => {
        const fetchDirectContracts = async () => {
          try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/contracts', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (response.ok) {
              const data = await response.json();
              setContracts(data);
              setLoading(false);
            } else {
              console.error('Failed to fetch direct contracts:', response.statusText);
              setLoading(false);
            }
          } catch (error) {
            console.error('Error fetching direct contracts:', error);
            setLoading(false);
          }
        };

        fetchDirectContracts();
      }, []);

      const handleChange = (e) => {
        setNewContract({ ...newContract, [e.target.name]: e.target.value });
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/contracts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(newContract),
          });
          if (response.ok) {
            console.log('Direct contract created successfully');
            // Refresh contracts after creating
            const fetchDirectContracts = async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/direct-contracts', {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                if (response.ok) {
                  const data = await response.json();
                  setContracts(data);
                } else {
                  console.error('Failed to fetch direct contracts:', response.statusText);
                }
              } catch (error) {
                console.error('Error fetching direct contracts:', error);
              }
            };
            fetchDirectContracts();
            setNewContract({
              client: '',
              contractDetails: '',
              startDate: '',
              endDate: '',
              budget: '',
            });
            setShowForm(false);
          } else {
            console.error('Failed to create direct contract:', response.statusText);
          }
        } catch (error) {
          console.error('Error creating direct contract:', error);
        }
      };

      const toggleForm = () => {
        setShowForm(!showForm);
      };

      if (loading) {
        return <div className="min-h-screen bg-light py-20">Loading...</div>;
      }

      return (
        <div className="min-h-screen bg-light py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-dark mb-4 font-serif">Direct Contracts</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Manage your direct contracts with clients outside of the standard job posting flow.
              </p>
            </div>
            <div className="mb-6 text-right">
              <button onClick={toggleForm} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-secondary transition">
                {showForm ? 'Hide Form' : 'Create New Contract'}
              </button>
            </div>
            {showForm && (
              <div className="bg-white p-8 rounded-xl shadow-sm mb-8">
                <h2 className="text-2xl font-semibold mb-6 font-serif">Create New Contract</h2>
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="client" className="block text-gray-700 text-sm font-bold mb-2">Client ID</label>
                    <input
                      type="text"
                      id="client"
                      name="client"
                      value={newContract.client}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Enter client ID"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="contractDetails" className="block text-gray-700 text-sm font-bold mb-2">Contract Details</label>
                    <textarea
                      id="contractDetails"
                      name="contractDetails"
                      value={newContract.contractDetails}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      rows="3"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="startDate" className="block text-gray-700 text-sm font-bold mb-2">Start Date</label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={newContract.startDate}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="endDate" className="block text-gray-700 text-sm font-bold mb-2">End Date</label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={newContract.endDate}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="budget" className="block text-gray-700 text-sm font-bold mb-2">Budget</label>
                    <input
                      type="number"
                      id="budget"
                      name="budget"
                      value={newContract.budget}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Enter budget"
                      required
                    />
                  </div>
                  <div className="text-center">
                    <button type="submit" className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-secondary transition">
                      Create Contract
                    </button>
                  </div>
                </form>
              </div>
            )}
            <div className="bg-white p-8 rounded-xl shadow-sm overflow-x-auto">
              <h2 className="text-2xl font-semibold mb-6 font-serif">Active Contracts</h2>
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2">Client</th>
                    <th className="px-4 py-2">Details</th>
                    <th className="px-4 py-2">Start Date</th>
                    <th className="px-4 py-2">End Date</th>
                    <th className="px-4 py-2">Budget</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract._id} className="border-b">
                      <td className="px-4 py-2">{contract.client.name}</td>
                      <td className="px-4 py-2">{contract.contractDetails}</td>
                      <td className="px-4 py-2">{new Date(contract.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{new Date(contract.endDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">${contract.budget}</td>
                      <td className="px-4 py-2">{contract.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    export default DirectContracts;
