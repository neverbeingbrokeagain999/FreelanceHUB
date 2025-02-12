import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const DirectMessages = () => {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  
  // Mock data for demonstration
  const [chats] = useState([
    {
      id: 1,
      name: 'John Smith',
      avatar: '/default-avatar.png',
      lastMessage: 'Looking forward to starting the project!',
      timestamp: '2 hours ago',
      unread: 2
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      avatar: '/default-avatar.png',
      lastMessage: 'Could you please review the latest changes?',
      timestamp: '5 hours ago',
      unread: 0
    },
    {
      id: 3,
      name: 'Mike Wilson',
      avatar: '/default-avatar.png',
      lastMessage: 'The payment has been processed',
      timestamp: '1 day ago',
      unread: 1
    }
  ]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="grid grid-cols-3 min-h-[600px]">
            {/* Chat List */}
            <div className="col-span-1 border-r border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Messages</h2>
              </div>
              <div className="overflow-y-auto h-[calc(600px-64px)]">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                      selectedChat?.id === chat.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={chat.avatar}
                        alt={chat.name}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {chat.name}
                          </p>
                          <p className="text-xs text-gray-500">{chat.timestamp}</p>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {chat.lastMessage}
                        </p>
                      </div>
                      {chat.unread > 0 && (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Window */}
            <div className="col-span-2">
              {selectedChat ? (
                <div className="h-full flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center">
                    <img
                      className="h-8 w-8 rounded-full mr-4"
                      src={selectedChat.avatar}
                      alt={selectedChat.name}
                    />
                    <h3 className="text-lg font-medium text-gray-900">
                      {selectedChat.name}
                    </h3>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-4">
                      {/* Sample messages - replace with actual message data */}
                      <div className="flex justify-end">
                        <div className="bg-blue-100 rounded-lg px-4 py-2 max-w-xs">
                          <p className="text-sm text-gray-900">Hi, I'm interested in your project.</p>
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
                          <p className="text-sm text-gray-900">Great! Let's discuss the details.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500"
                      />
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">Select a chat to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectMessages;
