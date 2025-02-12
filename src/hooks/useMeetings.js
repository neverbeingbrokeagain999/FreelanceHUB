import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useSocket } from './useSocket';

export const useMeetings = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [meetings, setMeetings] = useState([]);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: '',
    page: 1,
    limit: 10
  });

  // Fetch meetings
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const queryParams = new URLSearchParams({
          ...filters,
          userId: user._id
        });

        const response = await fetch(`/api/meetings?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch meetings');
        }

        const data = await response.json();
        setMeetings(data.meetings);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchMeetings();
  }, [filters, user]);

  // Create meeting
  const createMeeting = useCallback(async (meetingData) => {
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(meetingData)
      });

      if (!response.ok) {
        throw new Error('Failed to create meeting');
      }

      const newMeeting = await response.json();
      setMeetings(prev => [newMeeting, ...prev]);
      return newMeeting;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [user.token]);

  // Join meeting
  const joinMeeting = useCallback(async (meetingId) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to join meeting');
      }

      const meeting = await response.json();
      setActiveMeeting(meeting);
      return meeting;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [user.token]);

  // Leave meeting
  const leaveMeeting = useCallback(async (meetingId) => {
    try {
      await fetch(`/api/meetings/${meetingId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      setActiveMeeting(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [user.token]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on('meeting:updated', (updatedMeeting) => {
      setMeetings(prev => prev.map(meeting => 
        meeting._id === updatedMeeting._id ? updatedMeeting : meeting
      ));

      if (activeMeeting?._id === updatedMeeting._id) {
        setActiveMeeting(updatedMeeting);
      }
    });

    socket.on('meeting:deleted', (deletedMeetingId) => {
      setMeetings(prev => prev.filter(meeting => meeting._id !== deletedMeetingId));
      if (activeMeeting?._id === deletedMeetingId) {
        setActiveMeeting(null);
      }
    });

    return () => {
      socket.off('meeting:updated');
      socket.off('meeting:deleted');
    };
  }, [socket, activeMeeting]);

  return {
    meetings,
    activeMeeting,
    isLoading,
    error,
    filters,
    setFilters,
    createMeeting,
    joinMeeting,
    leaveMeeting
  };
};

export default useMeetings;
