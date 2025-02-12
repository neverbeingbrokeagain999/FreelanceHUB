import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import { WEBRTC_CONFIG, MEDIA_CONSTRAINTS, SIGNALING_MESSAGES } from '../config/webrtc';
import { useAuth } from './useAuth';

export const useVideoMeeting = (meetingId, participantType) => {
  const { user } = useAuth();
  const { socket, error: socketError } = useSocket();
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);
  
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Update error state when socket error occurs
  useEffect(() => {
    if (socketError) {
      setError(socketError);
    }
  }, [socketError]);

  // Initialize WebRTC connection
  const initializeConnection = useCallback(async () => {
    try {
      // Check if browser supports WebRTC
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support video meetings');
      }

      // Get media stream
      const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Create and configure peer connection
      const pc = new RTCPeerConnection(WEBRTC_CONFIG);
      peerConnection.current = pc;

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle incoming tracks
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit(SIGNALING_MESSAGES.ICE_CANDIDATE, {
            meetingId,
            candidate: event.candidate,
            participantType
          });
        }
      };

      // Handle connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') {
          setError('Connection failed. Please try again.');
          cleanupConnection();
        } else if (pc.iceConnectionState === 'connected') {
          setIsConnecting(false);
          setIsConnected(true);
        }
      };

      setIsConnecting(false);
    } catch (err) {
      console.error('Failed to initialize video meeting:', err);
      setError(err.message || 'Failed to access camera and microphone');
      setIsConnecting(false);
      cleanupConnection();
    }
  }, [meetingId, participantType, socket]);

  // Cleanup WebRTC connection and media streams
  const cleanupConnection = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    setRemoteStream(null);
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // Handle signaling messages
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async (data) => {
      try {
        if (!peerConnection.current) return;
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit(SIGNALING_MESSAGES.ANSWER, { meetingId, answer, participantType });
      } catch (err) {
        console.error('Error handling offer:', err);
        setError('Failed to establish connection');
      }
    };

    const handleAnswer = async (data) => {
      try {
        if (!peerConnection.current) return;
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      } catch (err) {
        console.error('Error handling answer:', err);
        setError('Failed to establish connection');
      }
    };

    const handleIceCandidate = async (data) => {
      try {
        if (!peerConnection.current) return;
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error('Error handling ICE candidate:', err);
      }
    };

    socket.on(SIGNALING_MESSAGES.OFFER, handleOffer);
    socket.on(SIGNALING_MESSAGES.ANSWER, handleAnswer);
    socket.on(SIGNALING_MESSAGES.ICE_CANDIDATE, handleIceCandidate);

    return () => {
      socket.off(SIGNALING_MESSAGES.OFFER, handleOffer);
      socket.off(SIGNALING_MESSAGES.ANSWER, handleAnswer);
      socket.off(SIGNALING_MESSAGES.ICE_CANDIDATE, handleIceCandidate);
    };
  }, [socket, meetingId, participantType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupConnection();
    };
  }, [cleanupConnection]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  const endCall = useCallback(() => {
    if (socket) {
      socket.emit(SIGNALING_MESSAGES.LEAVE, { meetingId, participantType });
    }
    cleanupConnection();
  }, [meetingId, participantType, socket, cleanupConnection]);

  return {
    isConnecting,
    isConnected,
    error,
    participants,
    isMuted,
    isVideoEnabled,
    localStream,
    remoteStream,
    initialize: initializeConnection,
    toggleAudio,
    toggleVideo,
    endCall
  };
};

export default useVideoMeeting;
