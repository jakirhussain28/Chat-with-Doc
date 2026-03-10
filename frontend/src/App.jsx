import { useState, useEffect } from 'react';
import Sidebar from './pages/Sidebar.jsx';
import Chat from './pages/Chat.jsx';
import './index.css';

export default function App() {

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('isSidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => { localStorage.setItem('isSidebarOpen', JSON.stringify(isSidebarOpen)); }, [isSidebarOpen]);

  return (
    <div className="app-container relative flex h-screen">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(o => !o)}
      />
      <Chat />
    </div>
  );
}