import React, { useState, useRef, useEffect } from 'react';
import { IoSend } from "react-icons/io5";

const SAMPLE_MESSAGES = [
    { id: 1, role: 'ai', text: "Hello! I'm ready to help you analyze your document. Upload a PDF, TXT, DOC, or CSV file to get started." },
];

function ChatArea() {
    const [messages, setMessages] = useState(SAMPLE_MESSAGES);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const sendMessage = () => {
        const text = input.trim();
        if (!text) return;
        setMessages(prev => [...prev, { id: Date.now(), role: 'user', text }]);
        setInput('');
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [
                ...prev,
                { id: Date.now() + 1, role: 'ai', text: `I received your query: "${text}". Please upload a document first so I can answer based on its content.` }
            ]);
        }, 1200);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    return (
        <div className="flex flex-col flex-1 bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-2 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
              ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-sm'
                                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'}`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex gap-3 justify-start">
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '160ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '320ms' }}></span>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="p-4">
                <div className="flex items-end gap-3 bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all duration-200">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter your query here..."
                        rows={1}
                        className="flex-1 bg-transparent text-slate-200 text-sm placeholder-slate-500 outline-none resize-none font-mono leading-relaxed pt-0.5"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim()}
                        className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-blue-500/30"
                    >
                        <IoSend className="w-4 h-4 text-white" />
                    </button>
                </div>
                {/* <p className="text-center text-slate-600 text-xs mt-2 font-mono">Press Enter to send · Shift+Enter for new line</p> */}
            </div>
        </div>
    );
}

export default ChatArea;
