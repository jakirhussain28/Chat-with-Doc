import React, { useState } from 'react';

const SAMPLE_CHATS = [
    { id: 1, title: 'Chat 1', subtitle: 'Machine Learning Basics', time: '2h ago' },
];

function RightPane() {
    const [chats, setChats] = useState(SAMPLE_CHATS);
    const [activeChat, setActiveChat] = useState(1);

    const handleNewChat = () => {
        const newChat = {
            id: Date.now(),
            title: `Chat ${chats.length + 1}`,
            subtitle: 'New conversation',
            time: 'Just now',
        };
        setChats(prev => [newChat, ...prev]);
        setActiveChat(newChat.id);
    };

    return (
        <div className="flex flex-col w-72 min-w-[272px] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700 bg-slate-800/60 backdrop-blur">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">History</span>
                </div>
                <button
                    onClick={handleNewChat}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-blue-500/30"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>New Chat</span>
                </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {chats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 py-10">
                        <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                        </svg>
                        <span className="text-xs text-slate-600">No chats yet</span>
                    </div>
                ) : (
                    chats.map(chat => (
                        <button
                            key={chat.id}
                            onClick={() => setActiveChat(chat.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 group
                ${activeChat === chat.id
                                    ? 'bg-blue-600/20 border border-blue-500/30'
                                    : 'hover:bg-slate-800 border border-transparent'}`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <svg className={`flex-shrink-0 w-3.5 h-3.5 ${activeChat === chat.id ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                                        <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
                                    </svg>
                                    <span className={`text-xs font-semibold truncate ${activeChat === chat.id ? 'text-blue-300' : 'text-slate-300 group-hover:text-slate-200'}`}>
                                        {chat.title}
                                    </span>
                                </div>
                                <span className="flex-shrink-0 text-slate-600 text-xs">{chat.time}</span>
                            </div>
                            <p className="text-slate-500 text-xs mt-0.5 truncate pl-5">{chat.subtitle}</p>
                        </button>
                    ))
                )}
            </div>

        </div>
    );
}

export default RightPane;
