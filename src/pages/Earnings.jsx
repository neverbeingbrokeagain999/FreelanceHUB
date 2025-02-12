import React, { useState, useEffect } from 'react';

    function Earnings() {
      const [transactions, setTransactions] = useState([]);
      const [withdrawalAmount, setWithdrawalAmount] = useState('');
      const [withdrawalMethod, setWithdrawalMethod] = useState('paypal');
      const [accountDetails, setAccountDetails] = useState('');
      const [withdrawalHistory, setWithdrawalHistory] = useState([]);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        const fetchTransactions = async () => {
          try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/transactions/freelancer', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (response.ok) {
              const data = await response.json();
              setTransactions(data);
            } else {
              console.error('Failed to fetch transactions:', response.statusText);
            }
          } catch (error) {
            console.error('Error fetching transactions:', error);
          }
        };

        const fetchWithdrawalHistory = async () => {
          try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/transactions/withdrawal-history', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (response.ok) {
              const data = await response.json();
              setWithdrawalHistory(data);
              setLoading(false);
            } else {
              console.error('Failed to fetch withdrawal history:', response.statusText);
              setLoading(false);
            }
          } catch (error) {
            console.error('Error fetching withdrawal history:', error);
            setLoading(false);
          }
        };

        fetchTransactions();
        fetchWithdrawalHistory();
      }, []);

      const handleWithdrawalRequest = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/transactions/withdrawal', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              amount: withdrawalAmount,
              paymentMethod: withdrawalMethod,
              accountDetails: accountDetails,
            }),
          });
          if (response.ok) {
            console.log('Withdrawal request submitted successfully');
            // Refresh transactions after withdrawal
            const fetchTransactions = async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/transactions/freelancer', {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                if (response.ok) {
                  const data = await response.json();
                  setTransactions(data);
                } else {
                  console.error('Failed to fetch transactions:', response.statusText);
                }
              } catch (error) {
                console.error('Error fetching transactions:', error);
              }
            };
            fetchTransactions();
            setWithdrawalAmount('');
            setAccountDetails('');
          } else {
            console.error('Failed to submit withdrawal request:', response.statusText);
          }
        } catch (error) {
          console.error('Error submitting withdrawal request:', error);
        }
      };

      if (loading) {
        return <div className="min-h-screen bg-light py-20">Loading...</div>;
      }

      return (
        <div className="min-h-screen bg-light py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-dark mb-4 font-serif">Earnings</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                View your earnings and manage your withdrawals.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm overflow-x-auto mb-8">
              <h2 className="text-2xl font-semibold mb-6 font-serif">Transaction History</h2>
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Client</th>
                    <th className="px-4 py-2">Job</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="border-b">
                      <td className="px-4 py-2">{new Date(transaction.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{transaction.payer.name}</td>
                      <td className="px-4 py-2">{transaction.job.title}</td>
                      <td className="px-4 py-2">${transaction.amount}</td>
                      <td className="px-4 py-2">{transaction.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm overflow-x-auto">
              <h2 className="text-2xl font-semibold mb-6 font-serif">Withdrawal History</h2>
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Method</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalHistory.map((withdrawal, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">{new Date(withdrawal.withdrawalDetails.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2">${withdrawal.withdrawalDetails.amount}</td>
                      <td className="px-4 py-2">{withdrawal.withdrawalDetails.paymentMethod}</td>
                      <td className="px-4 py-2">{withdrawal.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <h2 className="text-2xl font-semibold mb-6 font-serif">Withdrawal Request</h2>
              <div className="mb-4">
                <label htmlFor="withdrawalAmount" className="block text-gray-700 text-sm font-bold mb-2">Amount</label>
                <input
                  type="number"
                  id="withdrawalAmount"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter amount to withdraw"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="withdrawalMethod" className="block text-gray-700 text-sm font-bold mb-2">Payment Method</label>
                <select
                  id="withdrawalMethod"
                  value={withdrawalMethod}
                  onChange={(e) => setWithdrawalMethod(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="paypal">PayPal</option>
                  <option value="bankTransfer">Bank Transfer</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="accountDetails" className="block text-gray-700 text-sm font-bold mb-2">Account Details</label>
                <input
                  type="text"
                  id="accountDetails"
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter your account details"
                />
              </div>
              <div className="text-center">
                <button onClick={handleWithdrawalRequest} className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-secondary transition">
                  Request Withdrawal
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    export default Earnings;
