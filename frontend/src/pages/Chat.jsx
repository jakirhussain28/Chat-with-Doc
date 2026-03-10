import { useState, useEffect, useRef, useCallback } from 'react';
import { IoSend } from 'react-icons/io5';
import { CiChat1 } from "react-icons/ci";
import HistorySidebar from './Settings.jsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendChatMessage, fetchConversations, fetchConversation, deleteConversation } from '../api/chat';
import llmConfig from '../config/llm_config.json';

// ─── ChatBubble ────────────────────────────────────────────────────────────────

function ChatBubble({ role, content, isTyping }) {
    const isUser = role === 'user';

    if (isTyping) {
        return (
            <div className="flex gap-3 justify-start">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center h-[44px]">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '160ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '320ms' }}></span>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex gap-3 w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
                ${isUser
                    ? 'bg-cyan-600/50 text-white rounded-tr-sm'
                    : 'bg-[#1a1a1f] text-gray-200 border border-gray-700/40 rounded-tl-sm'
                }`}
            >
                {isUser ? (
                    <div className="whitespace-pre-wrap">{content}</div>
                ) : (
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1.5 text-slate-300" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-slate-300" {...props} />,
                            li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-3 last:mb-0 leading-relaxed text-slate-200" {...props} />,
                            a: ({ node, ...props }) => <a className="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-500/30 hover:decoration-blue-400 transition-all font-medium" {...props} />,
                            code: ({ node, inline, ...props }) =>
                                inline
                                    ? <code className="bg-slate-700 text-blue-300 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-slate-600 font-medium" {...props} />
                                    : <div className="relative my-4"><div className="absolute top-0 left-0 w-full h-8 bg-slate-800 rounded-t-xl border-b border-slate-700 flex items-center px-4"><span className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div><div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div></span></div><pre className="bg-slate-900 pt-10 pb-4 px-4 rounded-xl text-[13px] font-mono overflow-x-auto border border-slate-700 text-slate-300 shadow-inner"><code className="whitespace-pre" {...props} /></pre></div>,
                            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-white tracking-tight" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3 mt-5 text-white tracking-tight" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-3 mt-4 text-white tracking-tight" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
                            table: ({ node, ...props }) => <div className="overflow-x-auto my-4 rounded-lg border border-slate-700 shadow-sm"><table className="w-full text-left border-collapse text-sm" {...props} /></div>,
                            thead: ({ node, ...props }) => <thead className="bg-slate-800 text-slate-300" {...props} />,
                            th: ({ node, ...props }) => <th className="border-b border-slate-700 py-3 px-4 font-semibold" {...props} />,
                            td: ({ node, ...props }) => <td className="border-b border-slate-700/50 py-3 px-4 text-slate-300" {...props} />,
                            tr: ({ node, ...props }) => <tr className="hover:bg-slate-800/50 transition-colors" {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-500/50 pl-4 py-1 my-4 text-slate-400 bg-blue-500/5 rounded-r-xl italic" {...props} />
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                )}
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

    const [genLLM, setGenLLM] = useState('');
    const [embedLLM, setEmbedLLM] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);

    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);

    const [placeholder] = useState("Ask questions about your document");

    const handleFileClick = () => document.getElementById('chat-file-input')?.click();
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setUploadedFile(e.target.files[0].name);
            setHistoryOpen(true);
        }
    };

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
                            <h1 className="text-3xl font-bold text-gray-300">ChatDOX</h1>
                            <p className="text-gray-500 text-sm">Your RAG assistant.</p>

                            {/* Action Buttons */}
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-6">
                                <div className="flex flex-col gap-4">
                                    <div className="relative w-full h-[90px] bg-[#222222] hover:bg-[#2a2a2a] rounded-xl flex items-center justify-center border border-gray-700/50 transition-colors shadow-sm cursor-pointer group">
                                        <span className="text-gray-400 font-thin text-base tracking-wide group-hover:text-gray-300 transition-colors">
                                            {genLLM || 'Generation LLM'}
                                        </span>
                                        <select
                                            value={genLLM}
                                            onChange={e => setGenLLM(e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        >
                                            <option value="" disabled>Generation LLM</option>
                                            {llmConfig.generation_llms.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="relative w-full h-[90px] bg-[#222222] hover:bg-[#2a2a2a] rounded-xl flex items-center justify-center border border-gray-700/50 transition-colors shadow-sm cursor-pointer group">
                                        <span className="text-gray-400 font-thin text-base tracking-wide group-hover:text-gray-300 transition-colors">
                                            {embedLLM || 'Embedding LLM'}
                                        </span>
                                        <select
                                            value={embedLLM}
                                            onChange={e => setEmbedLLM(e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        >
                                            <option value="" disabled>Embedding LLM</option>
                                            {llmConfig.embedding_llms.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="h-full">
                                    <input id="chat-file-input" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.txt,.doc,.csv" />
                                    <div
                                        onClick={handleFileClick}
                                        className="relative w-full h-full bg-[#222222] hover:bg-[#2a2a2a] rounded-xl flex flex-col p-6 border border-gray-700/50 transition-colors cursor-pointer group shadow-sm"
                                    >
                                        <div className="flex gap-4 items-start">
                                            <CiChat1 className="w-8 h-8 text-gray-500 -mt-0.5" />
                                            <span className="text-gray-400 font-medium text-lg leading-snug group-hover:text-gray-300 transition-colors">
                                                Start New Chat
                                            </span>
                                        </div>
                                        <div className="absolute bottom-6 left-0 right-0 text-center">
                                            <span className="text-sm text-gray-500 font-thin tracking-wide">
                                                {uploadedFile || 'Upload PDF, Doc, Text, CSV'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                uploadedFile={uploadedFile}
            />
        </div>
    );
}