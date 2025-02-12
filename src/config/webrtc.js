export const WEBRTC_CONFIG = {
  iceServers: [
    {
      urls: [
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    },
  ],
  iceCandidatePoolSize: 10,
  sdpSemantics: 'unified-plan',
  encodedInsertableStreams: false,
  forceEncodedVideoInsertableStreams: false,
  forceEncodedAudioInsertableStreams: false,
};

export const MEDIA_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user',
  },
};

export const PC_CONFIG = {
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
  iceTransportPolicy: 'all',
  ...WEBRTC_CONFIG,
};

export const VIDEO_QUALITY_PROFILES = {
  low: {
    width: 320,
    height: 240,
    frameRate: 15,
  },
  medium: {
    width: 640,
    height: 480,
    frameRate: 30,
  },
  high: {
    width: 1280,
    height: 720,
    frameRate: 30,
  },
};

export const SIGNALING_MESSAGES = {
  OFFER: 'offer',
  ANSWER: 'answer',
  ICE_CANDIDATE: 'ice-candidate',
  NEGO_NEEDED: 'negotiation-needed',
  LEAVE: 'leave',
  JOIN: 'join',
  MUTE: 'mute',
  UNMUTE: 'unmute',
  SCREEN_SHARE: 'screen-share',
  STOP_SCREEN_SHARE: 'stop-screen-share',
};

export const CONNECTION_STATES = {
  NEW: 'new',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  FAILED: 'failed',
  CLOSED: 'closed',
};

export const ICE_CONNECTION_STATES = {
  NEW: 'new',
  CHECKING: 'checking',
  CONNECTED: 'connected',
  COMPLETED: 'completed',
  DISCONNECTED: 'disconnected',
  FAILED: 'failed',
  CLOSED: 'closed',
};

export default {
  WEBRTC_CONFIG,
  MEDIA_CONSTRAINTS,
  PC_CONFIG,
  VIDEO_QUALITY_PROFILES,
  SIGNALING_MESSAGES,
  CONNECTION_STATES,
  ICE_CONNECTION_STATES,
};
