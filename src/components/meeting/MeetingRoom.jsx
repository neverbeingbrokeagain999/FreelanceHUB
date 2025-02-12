import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVideoMeeting } from '../../hooks/useVideoMeeting';
import { useMeetings } from '../../hooks/useMeetings';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  PhoneXMarkIcon,
  ComputerDesktopIcon,
  ChatIcon,
  UserGroupIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicOff, VideoCameraIcon as CameraOff } from '@heroicons/react/24/solid';
import LoadingSpinner from '../LoadingSpinner';

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { activeMeeting } = useMeetings();
  const {
    joinMeeting,
    leaveMeeting,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    localStream,
    streams,
    meetingState
  } = useVideoMeeting();

  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);

  const localVideoRef = useRef(null);
  const participantRefs = useRef(new Map());

  useEffect(() => {
    const init = async () => {
      try {
        const deviceInfo = {
          browser: navigator.userAgent,
          os: navigator.platform,
          device: 'desktop' // TODO: Add proper device detection
        };

        await joinMeeting(meetingId, deviceInfo);
      } catch (err) {
        setError(err.message);
      }
    };

    init();

    return () => {
      leaveMeeting();
    };
  }, [meetingId, joinMeeting, leaveMeeting]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    streams.forEach((stream, participantId) => {
      const videoElement = participantRefs.current.get(participantId);
      if (videoElement && stream) {
        videoElement.srcObject = stream;
      }
    });
  }, [streams]);

  const handleAudioToggle = async () => {
    const success = await toggleAudio();
    if (success) {
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const handleVideoToggle = async () => {
    const success = await toggleVideo();
    if (success) {
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const handleScreenShare = async () => {
    const success = await toggleScreenShare();
    if (success) {
      setIsScreenSharing(!isScreenSharing);
    }
  };

  const handleEndMeeting = async () => {
    await leaveMeeting();
    navigate('/meetings');
  };

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/meetings')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Meetings
          </button>
        </div>
      </div>
    );
  }

  if (meetingState === 'initializing' || meetingState === 'connecting') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Main content area */}
      <div className="flex-1 flex">
        {/* Video grid */}
        <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Local video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-2 py-1 rounded">
              You {!isAudioEnabled && '(Muted)'}
            </div>
          </div>

          {/* Remote participants */}
          {Array.from(streams).map(([participantId, _]) => (
            <div
              key={participantId}
              className="relative bg-gray-800 rounded-lg overflow-hidden"
            >
              <video
                ref={el => participantRefs.current.set(participantId, el)}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                {activeMeeting?.participants.find(p => p.user._id === participantId)?.user.name || 'Participant'}
              </div>
            </div>
          ))}
        </div>

        {/* Side panel */}
        {(showChat || showParticipants || showSettings) && (
          <div className="w-80 bg-gray-800 border-l border-gray-700">
            {/* Panel content */}
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="bg-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleAudioToggle}
              className={`p-3 rounded-full ${
                isAudioEnabled ? 'bg-gray-600' : 'bg-red-600'
              }`}
            >
              {isAudioEnabled ? (
                <MicrophoneIcon className="h-6 w-6 text-white" />
              ) : (
                <MicOff className="h-6 w-6 text-white" />
              )}
            </button>

            <button
              onClick={handleVideoToggle}
              className={`p-3 rounded-full ${
                isVideoEnabled ? 'bg-gray-600' : 'bg-red-600'
              }`}
            >
              {isVideoEnabled ? (
                <VideoCameraIcon className="h-6 w-6 text-white" />
              ) : (
                <CameraOff className="h-6 w-6 text-white" />
              )}
            </button>

            <button
              onClick={handleScreenShare}
              className={`p-3 rounded-full ${
                isScreenSharing ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <ComputerDesktopIcon className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-3 rounded-full ${
                showChat ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <ChatIcon className="h-6 w-6 text-white" />
            </button>

            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={`p-3 rounded-full ${
                showParticipants ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <UserGroupIcon className="h-6 w-6 text-white" />
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-3 rounded-full ${
                showSettings ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <CogIcon className="h-6 w-6 text-white" />
            </button>

            <button
              onClick={handleEndMeeting}
              className="p-3 rounded-full bg-red-600"
            >
              <PhoneXMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
