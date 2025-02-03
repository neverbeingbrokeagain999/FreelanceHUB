import React, { useState, useEffect, useRef } from 'react';
    import { useParams } from 'react-router-dom';
    import { CheckCircle } from 'lucide-react';
    import { toast, ToastContainer } from 'react-toastify';
    import 'react-toastify/dist/ReactToastify.css';
    import ErrorBoundary from '../components/ErrorBoundary';
    import ChatBox from '../components/messaging/ChatBox'; // Import ChatBox

    function JobDetails() {
      const { id } = useParams();
      const [job, setJob] = useState(null);
      const [proposalText, setProposalText] = useState('');
      const [proposalPrice, setProposalPrice] = useState('');
      const [rating, setRating] = useState(0);
      const [reviewText, setReviewText] = useState('');
      const [paymentAmount, setPaymentAmount] = useState('');
      const [paymentMethod, setPaymentMethod] = useState('creditCard');
      const [files, setFiles] = useState([]);
      const [uploadFile, setUploadFile] = useState(null);
      const [timeEntries, setTimeEntries] = useState([]);
      const [timerRunning, setTimerRunning] = useState(false);
      const [currentTimerId, setCurrentTimerId] = useState(null);

      useEffect(() => {
        const fetchJobDetails = async () => {
          try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/jobs/${id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (response.ok) {
              const data = await response.json();
              setJob(data);
              setFiles(data.attachments || []);
            } else {
              console.error('Failed to fetch job details:', response.statusText);
            }
          } catch (error) {
            console.error('Error fetching job details:', error);
          }
        };


        const fetchTimeEntries = async () => {
          try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/time-tracking/${id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (response.ok) {
              const data = await response.json();
              setTimeEntries(data);
            } else {
              console.error('Failed to fetch time entries:', response.statusText);
            }
          } catch (error) {
            console.error('Error fetching time entries:', error);
          }
        };

        fetchJobDetails();
        fetchTimeEntries();
      }, [id]);


      const handleProposalSubmit = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/api/jobs/${id}/proposals`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              coverLetter: proposalText,
              price: proposalPrice,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Proposal submitted successfully:', data);
            // Refresh job details after submitting proposal
            const fetchJobDetails = async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/api/jobs/${id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                if (response.ok) {
                  const data = await response.json();
                  setJob(data);
                } else {
                  console.error('Failed to fetch job details:', response.statusText);
                }
              } catch (error) {
                console.error('Error fetching job details:', error);
              }
            };
            fetchJobDetails();
            setProposalText('');
            setProposalPrice('');
          } else {
            console.error('Failed to submit proposal:', response.statusText);
          }
        } catch (error) {
          console.error('Error submitting proposal:', error);
        }
      };

      const handleCompleteJob = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/api/jobs/${id}/complete`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            console.log('Job marked as completed:', id);
            // Refresh job details after marking as complete
            const fetchJobDetails = async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/api/jobs/${id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                if (response.ok) {
                  const data = await response.json();
                  setJob(data);
                } else {
                  console.error('Failed to fetch job details:', response.statusText);
                }
              } catch (error) {
                console.error('Error fetching job details:', error);
              }
            };
            fetchJobDetails();
          } else {
            console.error('Failed to mark job as completed:', response.statusText);
          }
        } catch (error) {
          console.error('Error marking job as completed:', error);
        }
      };

      const handleReviewSubmit = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/api/jobs/${id}/review`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              rating,
              comment: reviewText,
            }),
          });
          if (response.ok) {
            console.log('Review submitted successfully');
            // Refresh job details after submitting review
            const fetchJobDetails = async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/api/jobs/${id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                if (response.ok) {
                  const data = await response.json();
                  setJob(data);
                } else {
                  console.error('Failed to fetch job details:', response.statusText);
                }
              } catch (error) {
                console.error('Error fetching job details:', error);
              }
            };
            fetchJobDetails();
            setRating(0);
            setReviewText('');
          } else {
            console.error('Failed to submit review:', response.statusText);
          }
        } catch (error) {
          console.error('Error submitting review:', error);
        }
      };

      const handleMakePayment = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/api/jobs/${id}/payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              amount: paymentAmount,
              paymentMethod: paymentMethod,
            }),
          });
          if (response.ok) {
            console.log('Payment initiated successfully');
            // Refresh job details after payment
            const fetchJobDetails = async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/api/jobs/${id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                if (response.ok) {
                  const data = await response.json();
                  setJob(data);
                } else {
                  console.error('Failed to fetch job details:', response.statusText);
                }
              } catch (error) {
                console.error('Error fetching job details:', error);
              }
            };
            fetchJobDetails();
            setPaymentAmount('');
          } else {
            console.error('Failed to initiate payment:', response.statusText);
          }
        } catch (error) {
          console.error('Error initiating payment:', error);
        }
      };


      const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        setUploadFile(file);
      };

      const handleUpload = async () => {
        if (!uploadFile) {
          console.error('No file selected');
          return;
        }
        try {
          const token = localStorage.getItem('token');
          const formData = new FormData();
          formData.append('file', uploadFile);
          const response = await fetch(`http://localhost:5000/api/jobs/${id}/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });
          if (response.ok) {
            const data = await response.json();
            console.log('File uploaded successfully:', data);
            // Refresh job details after uploading file
            const fetchJobDetails = async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/api/jobs/${id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                if (response.ok) {
                  const data = await response.json();
                  setJob(data);
                  setFiles(data.attachments || []);
                } else {
                  console.error('Failed to fetch job details:', response.statusText);
                }
              } catch (error) {
                console.error('Error fetching job details:', error);
              }
            };
            fetchJobDetails();
            setUploadFile(null);
          } else {
            console.error('Failed to upload file:', response.statusText);
          }
        } catch (error) {
          console.error('Error uploading file:', error);
        }
      };

      const handleEndorseSkill = async (skill, freelancerId) => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/api/users/${freelancerId}/endorse`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ skill }),
          });
          if (response.ok) {
            console.log('Skill endorsed successfully:', skill);
            // Refresh job details after endorsement
            const fetchJobDetails = async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/api/jobs/${id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                if (response.ok) {
                  const data = await response.json();
                  setJob(data);
                } else {
                  console.error('Failed to fetch job details:', response.statusText);
                }
              } catch (error) {
                console.error('Error fetching job details:', error);
              }
            };
            fetchJobDetails();
          } else {
            const errorData = await response.json();
            console.error('Failed to endorse skill:', errorData.message);
          }
        } catch (error) {
          console.error('Error endorsing skill:', error);
        }
      };

      const handleAddTestimonial = async (freelancerId) => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/api/users/${freelancerId}/testimonial`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ text: reviewText }),
          });
          if (response.ok) {
            console.log('Testimonial added successfully');
            // Refresh job details after adding testimonial
            const fetchJobDetails = async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/api/jobs/${id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                if (response.ok) {
                  const data = await response.json();
                  setJob(data);
                } else {
                  console.error('Failed to fetch job details:', response.statusText);
                }
              } catch (error) {
                console.error('Error fetching job details:', error);
              }
            };
            fetchJobDetails();
            setReviewText('');
          } else {
            console.error('Failed to add testimonial:', response.statusText);
          }
        } catch (error) {
          console.error('Error adding testimonial:', error);
        }
      };

      const handleStartTimer = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:5000/api/time-tracking/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ jobId: id }),
          });
          if (response.ok) {
            const data = await response.json();
            console.log('Timer started successfully:', data);
            setTimerRunning(true);
            setCurrentTimerId(data.timeEntry._id);
          } else {
            console.error('Failed to start timer:', response.statusText);
          }
        } catch (error) {
          console.error('Error starting timer:', error);
        }
      };

      const handleStopTimer = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:5000/api/time-tracking/stop', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ timeEntryId: currentTimerId }),
          });
          if (response.ok) {
            console.log('Timer stopped successfully');
            setTimerRunning(false);
            setCurrentTimerId(null);
            const fetchTimeEntries = async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/api/time-tracking/${id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                if (response.ok) {
                  const data = await response.json();
                  setTimeEntries(data);
                } else {
                  console.error('Failed to fetch time entries:', response.statusText);
                }
              } catch (error) {
                console.error('Error fetching time entries:', error);
              }
            };
            fetchTimeEntries();
          } else {
            console.error('Failed to stop timer:', response.statusText);
          }
        } catch (error) {
          console.error('Error stopping timer:', error);
        }
      };

      if (!job) {
        return <div className="min-h-screen bg-light py-20">Loading...</div>;
      }

      return (
        <div className="min-h-screen bg-light py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-dark mb-4 font-serif">Job Details</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Review the details of this job listing and submit your proposal.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6 font-serif">{job.title}</h2>
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2 font-serif">Description</h3>
                <p className="text-gray-700">{job.description}</p>
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2 font-serif">Budget</h3>
                <p className="text-gray-700">${job.budget}</p>
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2 font-serif">Category</h3>
                <p className="text-gray-700">{job.category}</p>
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2 font-serif">Skills Required</h3>
                <ul className="list-disc list-inside text-gray-700">
                  {job.skills.map((skill, index) => (
                    <li key={index}>{skill}</li>
                  ))}
                </ul>
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2 font-serif">Client</h3>
                <p className="text-gray-700">{job.client}</p>
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2 font-serif">Proposals</h3>
                {job.proposals && job.proposals.map((proposal, index) => (
                  <div key={index} className="bg-gray-100 p-4 rounded-md mb-2">
                    <h4 className="font-semibold">Freelancer: {proposal.freelancer.name}</h4>
                    <p className="text-gray-700">Cover Letter: {proposal.coverLetter}</p>
                    <p className="text-gray-700">Price: ${proposal.price}</p>
                    <p className="text-gray-700">Status: {proposal.status}</p>
                    {proposal.freelancer && (
                      <div className="mt-2">
                        <h4 className="text-lg font-semibold mb-2 font-serif">Endorse Skills</h4>
                        {proposal.freelancer.skills && proposal.freelancer.skills.map((skill, index) => (
                          <button key={index} onClick={() => handleEndorseSkill(skill, proposal.freelancer._id)} className="bg-gray-200 text-gray-700 font-bold py-1 px-2 rounded-lg hover:bg-gray-300 transition mr-2 mb-2">
                            {skill}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2 font-serif">Submit Proposal</h3>
                <textarea
                  value={proposalText}
                  onChange={(e) => setProposalText(e.target.value)}
                  placeholder="Write your cover letter here..."
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                  rows="3"
                />
                <input
                  type="number"
                  value={proposalPrice}
                  onChange={(e) => setProposalPrice(e.target.value)}
                  placeholder="Your price"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="text-center mt-8">
                <button onClick={handleProposalSubmit} className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-secondary transition mr-2">
                  Submit Proposal
                </button>
                {job.status !== 'completed' && (
                  <button onClick={handleCompleteJob} className="bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition">
                    Mark as Completed
                  </button>
                )}
              </div>
              {job.status === 'completed' && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-2 font-serif">Rate and Review Freelancer</h3>
                  <div className="flex items-center mb-4">
                    <label className="mr-4">Rating:</label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(parseInt(e.target.value))}
                      className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                    </select>
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Write your review here..."
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
                    rows="3"
                  />
                  <div className="text-center">
                    <button onClick={handleReviewSubmit} className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-secondary transition">
                      Submit Review
                    </button>
                  </div>
                </div>
              )}
              {job.status === 'completed' && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-2 font-serif">Make Payment</h3>
                  <div className="flex items-center mb-4">
                    <label className="mr-4">Amount:</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="flex items-center mb-4">
                    <label className="mr-4">Payment Method:</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                      <option value="creditCard">Credit Card</option>
                      <option value="paypal">PayPal</option>
                      <option value="bankTransfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div className="text-center">
                    <button onClick={handleMakePayment} className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-secondary transition">
                      Make Payment
                    </button>
                  </div>
                </div>
              )}
              {job.status === 'completed' && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-2 font-serif">Add Testimonial</h3>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Write your testimonial here..."
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
                    rows="3"
                  />
                  <div className="text-center">
                    <button onClick={() => handleAddTestimonial(job.proposals.find(proposal => proposal.status === 'accepted')?.freelancer)} className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-secondary transition">
                      Add Testimonial
                    </button>
                  </div>
                </div>
              )}
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-2 font-serif">Chat</h3>
                <div ref={chatContainerRef} className="h-48 overflow-y-auto border p-2 mb-2">
                  {messages.map((msg, index) => (
                    <div key={index} className={`mb-2 p-2 rounded-md ${msg.sender._id === localStorage.getItem('userId') ? 'bg-blue-100 text-right' : 'bg-gray-100'}`}>
                      <p className="font-semibold">{msg.sender.name}</p>
                      <p dangerouslySetInnerHTML={{ __html: msg.message }}></p>
                      {msg.files && msg.files.map((file, fileIndex) => (
                        <div key={fileIndex}>
                          <a href={file} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            Attachment {fileIndex + 1}
                          </a>
                        </div>
                      ))}
                      {msg.isRead && msg.sender._id !== localStorage.getItem('userId') && (
                        <div className="flex items-center justify-end">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-gray-500 text-xs">
                            {msg.readAt && new Date(msg.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                  />
                  <input type="file" onChange={handleFileUpload} className="mr-2" />
                  <button onClick={handleSendMessage} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-secondary transition">
                    Send
                  </button>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-2 font-serif">File Sharing</h3>
                <input type="file" onChange={handleFileUpload} className="mb-2" />
                <button onClick={handleUpload} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-secondary transition">Upload File</button>
                <ul className="mt-4">
                  {files.map((file, index) => (
                    <li key={index} className="text-gray-700">
                      <a href={file} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        File {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-2 font-serif">Time Tracking</h3>
                {!timerRunning ? (
                  <button onClick={handleStartTimer} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-secondary transition">
                    Start Timer
                  </button>
                ) : (
                  <button onClick={handleStopTimer} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition">
                    Stop Timer
                  </button>
                )}
                <ul className="mt-4">
                  {timeEntries.map((entry, index) => (
                    <li key={index} className="text-gray-700">
                      Start: {new Date(entry.startTime).toLocaleString()} - End: {entry.endTime ? new Date(entry.endTime).toLocaleString() : 'In Progress'} - Duration: {entry.duration ? entry.duration.toFixed(2) : 'In Progress'} hours
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <ToastContainer />
        </div>
      );
    }

    export default JobDetails;
