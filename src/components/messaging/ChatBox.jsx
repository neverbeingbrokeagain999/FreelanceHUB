import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const ChatBox = ({ jobId, otherUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000'); // Replace with your server URL

    socketRef.current.emit('joinRoom', { jobId });

    socketRef.current.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [jobId]);

  useEffect(() => {
    // Scroll to bottom when messages update
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const messagePayload = {
        jobId: jobId,
        senderId: 'client', // Replace with actual sender ID (client/freelancer)
        receiverId: otherUser._id,
        text: newMessage,
        timestamp: new Date(),
      };
      socketRef.current.emit('sendMessage', messagePayload);
      setMessages((prevMessages) => [...prevMessages, { ...messagePayload, sender: 'client' }]); // Optimistically update
      setNewMessage('');
    }
  };

  return (
    <div className="chat-box" style={{ height: '300px', border: '1px solid #ccc', overflowY: 'scroll', padding: '10px' }} ref={chatContainerRef}>
      {messages.map((msg, index) => (
        <div key={index} className={`message ${msg.senderId === 'client' ? 'sent' : 'received'}`}>
          <strong>{msg.senderId}:</strong> {msg.text}
        </div>
      ))}
      <div className="input-area" style={{ display: 'flex', marginTop: '10px' }}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{ flex: '1', marginRight: '10px' }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatBox;
