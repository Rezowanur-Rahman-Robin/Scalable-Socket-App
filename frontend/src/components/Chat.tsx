import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext.tsx';
import './Chat.css';

interface User {
  id: string;
  username: string;
  isActive: boolean;
}

interface Message {
  from: string;
  content: string;
  to?: string;
  room?: string;
}

interface Room {
  name: string;
  users?: number;
}

const Chat = () => {
  const { socket, username } = useSocket();
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [existingRooms, setExistingRooms] = useState<Room[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('rooms:list');

    socket.on('rooms:update', (rooms: Room[]) => {
      console.log({rooms})
      setExistingRooms(rooms);
    });


    socket.on('users:update', (updatedUsers: User[]) => {
      setUsers(updatedUsers);
    });

    socket.on('message:receive', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('users:update');
      socket.off('message:receive');
      socket.off('rooms:update');
    };
  }, [socket]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    if (currentRoom) {
      socket?.emit('message:room', {
        content: newMessage,
        room: currentRoom,
        from: username
      });
    } else if (selectedUser) {
      socket?.emit('message:private', {
        content: newMessage,
        to: selectedUser,
        from: username
      });
    }

    setNewMessage('');
  };

  const createRoom = () => {
    if (!roomName.trim()) return;
    socket?.emit('room:create', roomName);
    setCurrentRoom(roomName);
    setRoomName('');
  };

  const joinRoom = (room: string) => {
    socket?.emit('room:join', room);
    setCurrentRoom(room);
    setSelectedUser(null)
  };

  // Add this helper function at the top of the component
  const getInitials = (name: string) => {
      return name[0].toUpperCase();
    };
     // Add this helper function after getInitials
     const getFilteredMessages = () => {
      if (currentRoom) {
        return messages.filter(msg => msg.room === currentRoom);
      }
      if (selectedUser) {
        return messages.filter(msg => 
          (msg.from === selectedUser && msg.to === username) || 
          (msg.from === username && msg.to === selectedUser)
        );
      }
      return [];
    };
  return (
    <div className="chat-container">
      {/* Left Sidebar */}
      <div className="sidebar">
        {/* User Profile Section */}
        <div className="user-profile">
          <div className="avatar">{username[0].toUpperCase()}</div>
          <div className="username">{username}</div>
        </div>

        {/* Create Room Section */}
        <div className="section">
          <h3 className="section-title">Create Room</h3>
          <div className="create-room">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Room name"
              className="room-input"
            />
            <button onClick={createRoom} className="room-button">
              Create
            </button>
          </div>
        </div>

        {/* Rooms List */}
        <div className="section">
          <h3 className="section-title">Available Rooms</h3>
          <div className="rooms-list">
            {existingRooms.map((room) => (
              <div
                key={room.name}
                onClick={() => joinRoom(room.name)}
                className={`room-item ${currentRoom === room.name ? 'active' : ''}`}
              >
                <div className="room-header">
                  <span>{room.name}</span>
                  {room.users && (
                    <span className="user-count">({room.users})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Users List */}
        <div className="section">
          <h3 className="section-title">Users</h3>
          <div className="users-list">
            {users
              .filter(user => user.username !== username)
              .map(user => (
              <div
                key={user.id}
                onClick={() => {
                  setSelectedUser(user.username)
                  setCurrentRoom(null)
                }}
                className={`user-item ${selectedUser === user.username ? 'active' : ''}`}
              >
                <div className="user-status">
                  <div className="user-avatar">
                    {getInitials(user.username)}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{user.username}</span>
                    <div className={`status-indicator ${user.isActive ? 'status-active' : 'status-inactive'}`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {/* Chat Header */}
        <div className="chat-header">
          <h2 className="chat-header-title">
            {currentRoom ? `Room: ${currentRoom}` : selectedUser ? `Chat with ${selectedUser}` : 'Select a chat'}
          </h2>
        </div>

        {/* Messages */}
        <div className="messages-container">
          {!currentRoom && !selectedUser ? (
            <div className="select-chat-message">
              Select a chat to start messaging
            </div>
          ) : (
            getFilteredMessages().map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.from === username ? 'sent' : 'received'}`}
              >
                <div className="message-header">
                  <div className="message-avatar">
                    {getInitials(msg.from)}
                  </div>
                  <div className="message-sender">{msg.from}</div>
                </div>
                <div className="message-content">{msg.content}</div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="input-area">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="message-input"
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage} className="send-button">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;