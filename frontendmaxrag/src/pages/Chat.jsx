import { useState, useEffect, useRef, useCallback } from 'react';
import { IoSend, IoAdd, IoTrashOutline } from 'react-icons/io5';
import { HiOutlineChatAlt2 } from 'react-icons/hi';
import { LuHistory } from "react-icons/lu";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendChatMessage, fetchConversations, fetchConversation, deleteConversation } from '../api/chat';

// ─── ChatBubble ────────────────────────────────────────────────────────────────

function ChatBubble({ role, content, isTyping }) {
    const isUser = role === 'user';
    return (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start mb-2 group'}`}>
            {!isUser && (
                <div className="flex-shrink-0 mr-3 mt-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/30 text-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.15)] backdrop-blur-sm">
                        <HiOutlineChatAlt2 className={`w-5 h-5 ${isTyping ? 'animate-pulse' : ''}`} />
                    </div>
                </div>
            )}
            <div className={`py-3 px-4.5 rounded-2xl max-w-[85%] sm:max-w-[75%] text-[15px] leading-relaxed shadow-sm ${isUser
                ? 'bg-blue-600/90 text-white rounded-br-sm'
                : 'bg-[#1a1a1f] text-gray-200 rounded-tl-sm border border-gray-700/40'
                } ${isTyping ? 'h-[48px] flex items-center' : ''}`}>
                {isTyping ? (
                    <div className="flex gap-1.5 items-center">
                        <span className="w-1.5 h-1.5 bg-blue-400/80 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-blue-400/80 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-blue-400/80 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                ) : isUser ? (
                    <div className="whitespace-pre-wrap">{content}</div>
                ) : (
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1.5 text-gray-300" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-gray-300" {...props} />,
                            li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-3 last:mb-0 leading-relaxed text-gray-200" {...props} />,
                            a: ({ node, ...props }) => <a className="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-500/30 hover:decoration-blue-400 transition-all font-medium" {...props} />,
                            code: ({ node, inline, ...props }) =>
                                inline
                                    ? <code className="bg-[#2a2a32] text-blue-300 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-gray-700/50 font-medium" {...props} />
                                    : <div className="relative my-4"><div className="absolute top-0 left-0 w-full h-8 bg-[#1e1e24] rounded-t-xl border-b border-gray-700/50 flex items-center px-4"><span className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div><div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div></span></div><pre className="bg-[#111114] pt-10 pb-4 px-4 rounded-xl text-[13px] font-mono overflow-x-auto border border-gray-700/50 text-gray-300 shadow-inner"><code className="whitespace-pre" {...props} /></pre></div>,
                            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-white tracking-tight" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3 mt-5 text-white tracking-tight" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-3 mt-4 text-white tracking-tight" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
                            table: ({ node, ...props }) => <div className="overflow-x-auto my-4 rounded-lg border border-gray-700/50 shadow-sm"><table className="w-full text-left border-collapse text-sm" {...props} /></div>,
                            thead: ({ node, ...props }) => <thead className="bg-[#24242a] text-gray-300" {...props} />,
                            th: ({ node, ...props }) => <th className="border-b border-gray-700 py-3 px-4 font-semibold" {...props} />,
                            td: ({ node, ...props }) => <td className="border-b border-gray-800/50 py-3 px-4 text-gray-300" {...props} />,
                            tr: ({ node, ...props }) => <tr className="hover:bg-[#1e1e24] transition-colors" {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-500/50 pl-4 py-1 my-4 text-gray-400 bg-blue-500/5 rounded-r-xl italic" {...props} />
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                )}
            </div>
        </div>
    );
}

// ─── HistorySidebar ────────────────────────────────────────────────────────────

function HistorySidebar({ conversations, activeId, onSelect, onDelete, onNewChat, isOpen, onToggle }) {
    return (
        <div
            className={`h-full flex flex-col bg-secondary/70 backdrop-blur-sm text-[15px] border-l border-[#413c4b] overflow-hidden transition-[width,min-width] duration-300 ease-in-out ${isOpen ? 'w-[220px] min-w-[220px]' : 'w-[50px] min-w-[50px]'}`}
            onMouseEnter={() => !isOpen && onToggle()}
            onMouseLeave={() => isOpen && onToggle()}
        >
            {/* Inner wrapper — always 220px wide, clipped by parent overflow-hidden */}
            <div className="w-[220px] h-full flex flex-col">
                {/* Collapsed icon — visible only when collapsed */}
                <div className={`absolute top-0 left-0 w-[50px] h-[52px] flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <LuHistory className="w-5 h-5 text-gray-400" />
                </div>

                {/* New Chat pill button */}
                <div className={`flex items-center justify-center pt-3 pb-2 px-3 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button
                        onClick={onNewChat}
                        className="flex items-center gap-2 px-5 py-2 rounded-full bg-[rgba(30,30,32,0.8)] border border-gray-700/60 text-primary text-sm font-medium hover:bg-[rgba(40,40,44,0.9)] transition-colors whitespace-nowrap"
                    >
                        <IoAdd className="w-4 h-4 flex-shrink-0" />
                        New Chat
                    </button>
                </div>

                {/* Divider */}
                <div className={`h-[1px] bg-[rgb(65,60,75)] mx-[10px] mb-1 flex-shrink-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} />

                {/* Conversation List */}
                <nav className={`flex-grow overflow-y-auto transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                    <ul className="list-none p-0 m-0">
                        {conversations.length === 0 ? (
                            <li className="px-4 py-3 text-center text-gray-500 text-xs whitespace-nowrap">No conversations yet</li>
                        ) : (
                            conversations.map(c => (
                                <li key={c._id}>
                                    <a
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); onSelect(c._id); }}
                                        className={`group flex items-center h-10 px-4 mx-1 transition-all duration-200 ease-in-out
                                            ${activeId === c._id ? 'bg-[rgba(73,66,85,0.6)] text-white rounded-md' : 'text-gray-400 hover:bg-[rgba(73,66,85,0.2)] hover:rounded-md'}`}
                                    >
                                        <span className="text-sm truncate flex-1 whitespace-nowrap">{c.title}</span>
                                        <button
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(c._id); }}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-500 hover:text-red-400 transition-all flex-shrink-0 ml-1"
                                            aria-label="Delete conversation">
                                            <IoTrashOutline className="w-3.5 h-3.5" />
                                        </button>
                                    </a>
                                </li>
                            ))
                        )}
                    </ul>
                </nav>
            </div>
        </div>
    );
}

// ─── ChatMAX ───────────────────────────────────────────────────────────────────

export default function ChatMAX() {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [activeConvId, setActiveConvId] = useState(null);
    const [historyOpen, setHistoryOpen] = useState(true);

    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);

    const placeholders = [
        "Where did I put my laptop?",
        "What's in my blue backpack?",
        "How is the weather tomorrow?",
        "Find my charger",
    ];
    const [placeholder] = useState(() => placeholders[Math.floor(Math.random() * placeholders.length)]);

    // Scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [inputValue]);

    // Load conversations
    const loadConversations = useCallback(async () => {
        try {
            const data = await fetchConversations('default_user');
            setConversations(data);
        } catch (e) {
            console.error('Failed to load conversations:', e);
        }
    }, []);

    useEffect(() => { loadConversations(); }, [loadConversations]);

    // Load a conversation
    const loadConversation = async (convId) => {
        try {
            const conv = await fetchConversation(convId);
            setMessages(conv.messages || []);
            setActiveConvId(convId);
        } catch (e) {
            console.error('Failed to load conversation:', e);
        }
    };

    // New chat
    const handleNewChat = () => {
        setMessages([]);
        setActiveConvId(null);
        setInputValue('');
    };

    // Delete conversation
    const handleDeleteConversation = async (convId) => {
        try {
            await deleteConversation(convId);
            if (activeConvId === convId) handleNewChat();
            loadConversations();
        } catch (e) {
            console.error('Failed to delete conversation:', e);
        }
    };

    // Send message
    const handleSend = async () => {
        const trimmed = inputValue.trim();
        if (!trimmed || isStreaming) return;

        const userMsg = { role: 'user', content: trimmed };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsStreaming(true);

        // Add placeholder for bot response
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            const response = await sendChatMessage(trimmed, 'default_user', activeConvId);
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let convId = activeConvId;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.token) {
                            setMessages(prev => {
                                const updated = [...prev];
                                const last = updated[updated.length - 1];
                                if (last?.role === 'assistant') {
                                    updated[updated.length - 1] = { ...last, content: last.content + data.token };
                                }
                                return updated;
                            });
                        }
                        if (data.done && data.conversation_id) {
                            convId = data.conversation_id;
                        }
                        if (data.error) {
                            console.error('Stream error:', data.error);
                        }
                    } catch { /* skip malformed lines */ }
                }
            }

            if (convId) setActiveConvId(convId);
            loadConversations();
        } catch (e) {
            console.error('Chat error:', e);
            setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant' && !last.content) {
                    updated[updated.length - 1] = { ...last, content: 'Sorry, something went wrong. Please try again.' };
                }
                return updated;
            });
        } finally {
            setIsStreaming(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const isChatStarted = messages.length > 0;

    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full min-w-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto">
                    {!isChatStarted ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <HiOutlineChatAlt2 className="w-12 h-12 text-gray-600" />
                            <h1 className="text-3xl font-bold text-primary">ChatMAX</h1>
                            <p className="text-gray-500 text-sm">Your home organiser assistant</p>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-4">
                            {messages.map((msg, i) => {
                                const isTyping = isStreaming && i === messages.length - 1 && msg.role === 'assistant' && msg.content === '';
                                return <ChatBubble key={i} role={msg.role} content={msg.content} isTyping={isTyping} />;
                            })}
                            <div ref={chatEndRef} />
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="flex-shrink-0 p-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex items-end gap-2 rounded-xl border border-gray-700/60 bg-secondary/40 backdrop-blur-sm px-4 py-2.5 focus-within:border-gray-500 transition-colors">
                            <textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholder}
                                rows={1}
                                disabled={isStreaming}
                                className="flex-1 bg-transparent pb-1 text-primary text-sm placeholder-gray-500 focus:outline-none resize-none max-h-[120px] leading-relaxed"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isStreaming}
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                                aria-label="Send message">
                                <IoSend className="w-4.5 h-4.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Sidebar */}
            <HistorySidebar
                conversations={conversations}
                activeId={activeConvId}
                onSelect={loadConversation}
                onDelete={handleDeleteConversation}
                onNewChat={handleNewChat}
                isOpen={historyOpen}
                onToggle={() => setHistoryOpen(o => !o)}
            />
        </div>
    );
}