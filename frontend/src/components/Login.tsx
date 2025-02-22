import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.tsx';

const Login= () => {
  const [inputUsername, setInputUsername] = useState('');
  const { socket, setUsername } = useSocket();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputUsername.trim() && socket) {
      setUsername(inputUsername);
      socket.emit('user:join', inputUsername);
      navigate('/chat');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputUsername}
          onChange={(e) => setInputUsername(e.target.value)}
          placeholder="Enter your username"
        />
        <button type="submit">Join Chat</button>
      </form>
    </div>
  );
};

export default Login;