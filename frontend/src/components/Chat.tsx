import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext.tsx';

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

const Chat = () => {
  const { socket, username } = useSocket();
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('users:update', (updatedUsers: User[]) => {
      setUsers(updatedUsers);
    });

    socket.on('message:receive', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('users:update');
      socket.off('message:receive');
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
  };

  return (
    <div className="chat-container">
      <div className="users-list">
        <h3>Users</h3>
        {users.map(user => (
          <div
            key={user.id}
            onClick={() => setSelectedUser(user.username)}
            className={`user ${user.isActive ? 'active' : 'inactive'}`}
          >
            {user.username}
          </div>
        ))}
      </div>

      <div className="chat-area">
        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.from === username ? 'sent' : 'received'}`}>
              <span className="sender">{msg.from}:</span>
              {msg.content}
            </div>
          ))}
        </div>

        <div className="input-area">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>

      <div className="rooms">
        <h3>Create Room</h3>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Room name"
        />
        <button onClick={createRoom}>Create Room</button>
      </div>
    </div>
  );
};

export default Chat;