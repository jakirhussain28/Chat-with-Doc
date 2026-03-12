import React from 'react';
import logoX from '/src/assets/X-light-logo-corner-32x32.svg';
import { LuHistory } from "react-icons/lu";
import { IoAdd, IoTrashOutline, IoChevronDown, IoGitBranchOutline } from 'react-icons/io5';

export default function Sidebar({ isOpen, toggleSidebar, conversations = [], activeId, onSelect, onDelete, onNewChat }) {
  const [expandedChats, setExpandedChats] = React.useState({});

  const toggleChat = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedChats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-30 flex flex-col h-screen bg-secondary/70 backdrop-blur-sm text-[15px] border-r border-[#413c4b] transition-[width,min-width] duration-300 ease-in-out ${isOpen ? 'w-[280px] min-w-[280px]' : 'w-[50px] min-w-[50px]'}`}
      onMouseEnter={() => !isOpen && toggleSidebar()}
      onMouseLeave={() => isOpen && toggleSidebar()}
    >
      {/* Logo — centered in collapsed, left-padded in expanded */}
      <div className="relative mb-2 after:content-[''] after:absolute after:bottom-0 after:left-[10px] after:right-[10px] after:h-[1px] after:bg-[rgb(65,60,75)]">
        <div className={`flex items-center h-[52px] overflow-hidden pl-[14px]`}>
          <img src={logoX} alt="MaxFinder logo" className="h-5 w-5 flex-shrink-0" />
          <span className={`whitespace-nowrap overflow-hidden transition-[width,opacity,margin] duration-300 ease-in-out text-primary text-base font-semibold uppercase tracking-[0.50em] ${isOpen ? 'w-auto opacity-100 ml-3' : 'w-0 opacity-0 ml-0'}`} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Chat Dox</span>
        </div>
      </div>

      <div className="relative flex-grow overflow-hidden">
        <div className="w-[280px] h-full flex flex-col">
          {/* Collapsed icon — visible only when collapsed */}
          <div className={`absolute top-0 left-0 w-[50px] h-[52px] flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <LuHistory className="w-5 h-5 text-gray-400" />
          </div>

          {/* New Chat pill button */}
          <div className={`flex items-center justify-center gap-2 pt-3 pb-2 px-3 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button
              onClick={onNewChat}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(30,30,32,0.8)] border border-gray-700/60 text-primary text-sm font-medium hover:bg-[rgba(40,40,44,0.9)] transition-colors whitespace-nowrap"
            >
              <IoAdd className="w-4 h-4 flex-shrink-0" />
              New Chat
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(30,30,32,0.8)] border border-gray-700/60 text-primary text-sm font-medium hover:bg-[rgba(40,40,44,0.9)] transition-colors whitespace-nowrap"
              title="New Thread"
            >
              <IoGitBranchOutline className="w-4 h-4 flex-shrink-0" />
              New Thread
            </button>
          </div>

          {/* Divider */}
          <div className={`h-[1px] bg-[rgb(65,60,75)] mx-[10px] mb-1 flex-shrink-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} />

          {/* Conversation List */}
          <nav className={`flex-grow overflow-y-auto transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            <ul className="list-none p-0 m-0">
              {!conversations || conversations.length === 0 ? (
                <li className="px-4 py-3 text-center text-gray-500 text-xs whitespace-nowrap">No conversations yet</li>
              ) : (
                conversations.map(c => {
                  const isExpanded = expandedChats[c._id] !== false; // default to expanded
                  const threads = c.threads && c.threads.length > 0 ? c.threads : [
                    { _id: `mock1-${c._id}`, title: 'thread title...' },
                    { _id: `mock2-${c._id}`, title: 'thread title...' },
                  ];

                  return (
                    <li key={c._id} className="mb-1">
                      <div
                        onClick={(e) => { e.preventDefault(); onSelect && onSelect(c._id); }}
                        className={`group flex items-center h-8 px-2 mx-2 cursor-pointer transition-all duration-200 ease-in-out
                          ${activeId === c._id ? 'bg-[rgba(73,66,85,0.6)] text-white rounded-md' : 'text-gray-400 hover:bg-[rgba(73,66,85,0.2)] hover:rounded-md'}`}
                      >
                        <button onClick={(e) => toggleChat(e, c._id)} className="p-1 mr-1 rounded hover:bg-[rgba(255,255,255,0.1)]">
                          <IoChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                        </button>
                        <span className="text-[15px] font-medium truncate flex-1 whitespace-nowrap">{c.title || 'Chat title'}</span>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete && onDelete(c._id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-500 hover:text-red-400 transition-all flex-shrink-0 ml-1"
                          aria-label="Delete conversation"
                        >
                          <IoTrashOutline className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Threads section */}
                      {isExpanded && threads.length > 0 && (
                        <ul className="relative ml-[34px] mt-0.5 flex flex-col pb-1">
                          {threads.map((thread, idx) => (
                            <li key={thread._id} className="relative flex items-center h-7 text-[#9a94a6] text-[13px] hover:text-white cursor-pointer group">
                              <div className="absolute inset-0 right-2 bg-transparent group-hover:bg-[rgba(73,66,85,0.2)] rounded-md z-0" />

                              {/* Curved line for first item */}
                              {idx === 0 && (
                                <div className="absolute left-[-11px] top-[-12px] w-[16px] h-[26px] border-l-[1.5px] border-b-[1.5px] border-[#5e5a66] rounded-bl-xl pointer-events-none z-0" />
                              )}

                              {/* Vertical straight line for subsequent items */}
                              {idx > 0 && (
                                <div className="absolute left-[6px] top-[-14px] w-[1.5px] h-[28px] bg-[#5e5a66] pointer-events-none z-0" />
                              )}

                              <div className="relative z-10 w-[5px] h-[5px] rounded-full bg-[#5e5a66] ml-1 mr-2 flex-shrink-0" />
                              <span className="relative z-10 truncate flex-1 pr-2">{thread.title}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </nav>
        </div>
      </div>


    </aside>
  );
}