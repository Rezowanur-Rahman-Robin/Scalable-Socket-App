import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.tsx';
import './Login.css';

const Login = () => {
  const [inputUsername, setInputUsername] = useState('');
  const { socket, setUsername } = useSocket();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUsername.trim() && socket) {
      setUsername(inputUsername);
      socket.emit('user:join', inputUsername);
      navigate('/chat');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Welcome to Chat App</h2>
        <p className="login-subtitle">Please enter your username to continue</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
            placeholder="Enter your username"
            className="login-input"
          />
          <button type="submit" className="login-button">Join Chat</button>
        </form>
      </div>
    </div>
  );
};

export default Login;