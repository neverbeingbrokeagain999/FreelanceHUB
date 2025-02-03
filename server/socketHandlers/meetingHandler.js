import Meeting from '../models/Meeting.js';

export default function setupMeetingHandlers(io) {
  // Meeting namespace
  const meetingNamespace = io.of('/meetings');

  meetingNamespace.on('connection', (socket) => {
    let currentMeetingId = null;
    let currentUserId = null;

    socket.on('joinMeeting', async ({ meetingId, userId }) => {
      try {
        const meeting = await Meeting.findOne({ meetingId });
        if (!meeting) {
          socket.emit('error', { message: 'Meeting not found' });
          return;
        }

        // Join the meeting room
        socket.join(`meeting_${meetingId}`);
        currentMeetingId = meetingId;
        currentUserId = userId;

        // Get participant info
        const participant = meeting.participants.find(
          p => p.user.toString() === userId && !p.leftAt
        );

        if (!participant) {
          socket.emit('error', { message: 'Not a participant of this meeting' });
          return;
        }

        // Notify others in the meeting
        socket.to(`meeting_${meetingId}`).emit('userJoined', {
          userId,
          role: meeting.host.toString() === userId ? 'host' : 'participant'
        });

        // Send current participants list to the joining user
        const activeParticipants = meeting.participants
          .filter(p => !p.leftAt)
          .map(p => ({
            userId: p.user.toString(),
            role: meeting.host.toString() === p.user.toString() ? 'host' : 'participant'
          }));

        socket.emit('meetingJoined', {
          participants: activeParticipants,
          isHost: meeting.host.toString() === userId
        });
      } catch (error) {
        console.error('Join meeting socket error:', error);
        socket.emit('error', { message: 'Failed to join meeting' });
      }
    });

    // WebRTC Signaling
    socket.on('offer', ({ targetUserId, description }) => {
      if (!currentMeetingId) return;
      socket.to(`meeting_${currentMeetingId}`)
        .to(targetUserId)
        .emit('offer', {
          fromUserId: currentUserId,
          description
        });
    });

    socket.on('answer', ({ targetUserId, description }) => {
      if (!currentMeetingId) return;
      socket.to(`meeting_${currentMeetingId}`)
        .to(targetUserId)
        .emit('answer', {
          fromUserId: currentUserId,
          description
        });
    });

    socket.on('iceCandidate', ({ targetUserId, candidate }) => {
      if (!currentMeetingId) return;
      socket.to(`meeting_${currentMeetingId}`)
        .to(targetUserId)
        .emit('iceCandidate', {
          fromUserId: currentUserId,
          candidate
        });
    });

    // Meeting Controls
    socket.on('toggleAudio', ({ enabled }) => {
      if (!currentMeetingId) return;
      socket.to(`meeting_${currentMeetingId}`).emit('userAudioUpdate', {
        userId: currentUserId,
        enabled
      });
    });

    socket.on('toggleVideo', ({ enabled }) => {
      if (!currentMeetingId) return;
      socket.to(`meeting_${currentMeetingId}`).emit('userVideoUpdate', {
        userId: currentUserId,
        enabled
      });
    });

    socket.on('startScreenShare', () => {
      if (!currentMeetingId) return;
      socket.to(`meeting_${currentMeetingId}`).emit('userStartedScreenShare', {
        userId: currentUserId
      });
    });

    socket.on('stopScreenShare', () => {
      if (!currentMeetingId) return;
      socket.to(`meeting_${currentMeetingId}`).emit('userStoppedScreenShare', {
        userId: currentUserId
      });
    });

    // Chat Messages
    socket.on('sendMessage', async ({ content, type = 'text', file = null }) => {
      if (!currentMeetingId) return;
      try {
        const meeting = await Meeting.findOne({ meetingId: currentMeetingId });
        if (!meeting) return;

        const message = {
          sender: currentUserId,
          content,
          type,
          timestamp: new Date(),
          file
        };

        meeting.chat.push(message);
        await meeting.save();

        socket.to(`meeting_${currentMeetingId}`).emit('newMessage', message);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Connection Status
    socket.on('updateConnectionQuality', ({ quality }) => {
      if (!currentMeetingId) return;
      socket.to(`meeting_${currentMeetingId}`).emit('userConnectionUpdate', {
        userId: currentUserId,
        quality
      });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      if (currentMeetingId && currentUserId) {
        try {
          const meeting = await Meeting.findOne({ meetingId: currentMeetingId });
          if (meeting) {
            // Update participant's left time
            const participant = meeting.participants.find(
              p => p.user.toString() === currentUserId && !p.leftAt
            );
            if (participant) {
              participant.leftAt = new Date();
              await meeting.save();
            }

            // Notify others
            socket.to(`meeting_${currentMeetingId}`).emit('userLeft', {
              userId: currentUserId
            });

            // If no participants left and meeting is active, end it
            const activeParticipants = meeting.participants.filter(p => !p.leftAt);
            if (activeParticipants.length === 0 && meeting.status === 'active') {
              meeting.status = 'completed';
              meeting.endTime = new Date();
              await meeting.save();
              
              socket.to(`meeting_${currentMeetingId}`).emit('meetingEnded', {
                meetingId: currentMeetingId
              });
            }
          }
        } catch (error) {
          console.error('Disconnect handler error:', error);
        }
      }
    });
  });

  return meetingNamespace;
}
