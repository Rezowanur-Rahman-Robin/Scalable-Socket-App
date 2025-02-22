import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login.tsx';
import Chat from './components/Chat.tsx';
import { SocketProvider } from './context/SocketContext.tsx';

function MyApp() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default MyApp;