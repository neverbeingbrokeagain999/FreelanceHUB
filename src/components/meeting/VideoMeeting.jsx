import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useVideoMeeting } from '../../hooks/useVideoMeeting';
import LoadingSpinner from '../LoadingSpinner';

// SVG icons as inline components
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0115.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
  </svg>
);

const MutedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
  </svg>
);

const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const VideoOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6 transform rotate-90">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h5m0 0v5m0-5l-6 6M3 16v5m0 0h5m-5 0l6-6" />
  </svg>
);

const VideoMeeting = ({ meetingId, participantType }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const {
    isConnecting,
    isConnected,
    error,
    isMuted,
    isVideoEnabled,
    localStream,
    remoteStream,
    initialize,
    toggleAudio,
    toggleVideo,
    endCall
  } = useVideoMeeting(meetingId, participantType);

  useEffect(() => {
    initialize().catch(error => {
      console.error('Failed to initialize video meeting:', error);
    });
  }, [initialize]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
        <p className="ml-2">Connecting to meeting...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 text-white text-sm">
            You
          </div>
        </div>
        {isConnected && remoteStream && (
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 text-white text-sm">
              Remote User
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full ${
            isMuted ? 'bg-red-600' : 'bg-gray-700'
          } hover:opacity-80 transition-opacity text-white`}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MutedIcon /> : <MicIcon />}
        </button>
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${
            !isVideoEnabled ? 'bg-red-600' : 'bg-gray-700'
          } hover:opacity-80 transition-opacity text-white`}
          aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {!isVideoEnabled ? <VideoOffIcon /> : <VideoIcon />}
        </button>
        <button
          onClick={endCall}
          className="p-3 rounded-full bg-red-600 hover:opacity-80 transition-opacity text-white"
          aria-label="End call"
        >
          <PhoneIcon />
        </button>
      </div>
    </div>
  );
};

VideoMeeting.propTypes = {
  meetingId: PropTypes.string.isRequired,
  participantType: PropTypes.oneOf(['host', 'guest']).isRequired,
};

export default VideoMeeting;
