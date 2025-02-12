import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from '../components/ErrorBoundary';
import ChatBox from '../components/messaging/ChatBox';
import VideoMeeting from '../components/meeting/VideoMeeting';
import EscrowDetails from '../components/job/EscrowDetails';
import { useAuth } from '../hooks/useAuth';

function JobDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [proposalText, setProposalText] = useState('');
  const [proposalPrice, setProposalPrice] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [files, setFiles] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [currentTimerId, setCurrentTimerId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatContainerRef = React.useRef(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/jobs/${id}`, {
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
        const response = await fetch(`/api/time-tracking/${id}`, {
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

  // ... (keep all the existing handler functions)

  if (!job) {
    return <div className="min-h-screen bg-light py-20">Loading...</div>;
  }

  const acceptedProposal = job.proposals?.find(p => p.status === 'accepted');
  const isClient = user?._id === job.clientId;
  const isFreelancer = user?._id === acceptedProposal?.freelancerId;

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
          {/* Job Details Section */}
          <h2 className="text-2xl font-semibold mb-6 font-serif">{job.title}</h2>
          
          {/* Payment Protection Section - New Addition */}
          {(isClient || isFreelancer) && acceptedProposal && (
            <EscrowDetails
              jobId={id}
              clientId={job.clientId}
              freelancerId={acceptedProposal.freelancerId}
              budget={job.budget}
            />
          )}

          {/* Rest of the sections remain the same */}
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2 font-serif">Description</h3>
            <p className="text-gray-700">{job.description}</p>
          </div>
          
          {/* ... Keep all other existing sections ... */}
          
          {/* Chat Section */}
          {/* Video Meeting Section - New Addition */}
          {(isClient || isFreelancer) && acceptedProposal && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-2 font-serif">Video Meeting</h3>
              <VideoMeeting
                jobId={id}
                participants={[
                  { id: job.clientId, name: job.clientName },
                  { id: acceptedProposal.freelancerId, name: acceptedProposal.freelancerName }
                ]}
              />
            </div>
          )}

          {/* Chat Section */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-2 font-serif">Chat</h3>
            <ChatBox
              jobId={id}
              messages={messages}
              onSendMessage={(message) => {
                // Handle send message
                setMessages([...messages, message]);
              }}
            />
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default JobDetails;
