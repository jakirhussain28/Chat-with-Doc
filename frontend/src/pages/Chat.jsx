import { useState, useEffect, useRef, useCallback } from 'react';
import { IoSend } from 'react-icons/io5';
import { CiChat1 } from "react-icons/ci";
import HistorySidebar from './Settings.jsx';
import ChatBubble from './ChatBubble.jsx';
import { sendChatMessage, fetchConversations, fetchConversation, deleteConversation } from '../api/chat';
import llmConfig from '../config/llm_config.json';

// ─── ChatDOX ───────────────────────────────────────────────────────────────────

export default function ChatMAX() {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [activeConvId, setActiveConvId] = useState(null);
    const [historyOpen, setHistoryOpen] = useState(true);

    const [genLLM, setGenLLM] = useState(() => localStorage.getItem('genLLM') || '');
    const [embedLLM, setEmbedLLM] = useState(() => localStorage.getItem('embedLLM') || '');
    const [uploadedFile, setUploadedFile] = useState(null);

    // NEW: default system prompt state
    const [systemPrompt, setSystemPrompt] = useState('You are a concise chat assistant.');

    // State to control the top-middle caution alert
    const [showLlmAlert, setShowLlmAlert] = useState(false);

    // Persist LLM selections
    useEffect(() => {
        if (genLLM) localStorage.setItem('genLLM', genLLM);
    }, [genLLM]);

    useEffect(() => {
        if (embedLLM) localStorage.setItem('embedLLM', embedLLM);
    }, [embedLLM]);

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

        // Show top-middle caution if Generation LLM is missing
        if (!genLLM) {
            setShowLlmAlert(true);
            setTimeout(() => setShowLlmAlert(false), 3000);
            return;
        }

        const userMsg = { role: 'user', content: trimmed };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsStreaming(true);

        // Add placeholder for bot response
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            // NEW: Passing systemPrompt down into the API call
            const response = await sendChatMessage(trimmed, 'default_user', activeConvId, genLLM, systemPrompt);
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
        <div className="flex h-full w-full overflow-hidden relative">

            {showLlmAlert && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-grey-300/10 border border-amber-500/50 text-amber-600 px-5 py-2.5 rounded-lg shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-5 duration-300 pointer-events-none">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium text-sm tracking-wide">Please select a Generation LLM</span>
                </div>
            )}

            <div className="flex-1 flex flex-col h-full min-w-0">
                <div className="flex-1 overflow-y-auto">
                    {!isChatStarted ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <h1 className="text-3xl font-bold text-gray-300">ChatDOX</h1>
                            <p className="text-gray-500 text-sm">Your RAG assistant.</p>

                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-6">
                                <div className="flex flex-col gap-4">
                                    <div className="relative w-full h-[90px] bg-[#222222] hover:bg-[#2a2a2a] rounded-xl flex items-center justify-center border border-gray-700/50 transition-colors shadow-sm cursor-pointer group overflow-hidden">
                                        <span className={`absolute transition-all duration-300 ease-out tracking-wide group-hover:text-gray-300 ${
                                            genLLM 
                                                ? 'top-2.5 text-xl font-normal text-gray-400' 
                                                : 'top-1/2 -translate-y-1/2 text-base font-thin text-gray-400'
                                        }`}>
                                            Generation LLM
                                        </span>
                                        <span className={`absolute bottom-3 text-[15px] text-gray-500 transition-all duration-300 ease-out ${
                                            genLLM 
                                                ? 'opacity-100 translate-y-0' 
                                                : 'opacity-0 translate-y-2'
                                        }`}>
                                            {genLLM}
                                        </span>
                                        <select
                                            value={genLLM}
                                            onChange={e => setGenLLM(e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        >
                                            <option value="" disabled>Generation LLM</option>
                                            {llmConfig.generation_llms.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="relative w-full h-[90px] bg-[#222222] hover:bg-[#2a2a2a] rounded-xl flex items-center justify-center border border-gray-700/50 transition-colors shadow-sm cursor-pointer group overflow-hidden">
                                        <span className={`absolute transition-all duration-300 ease-out tracking-wide group-hover:text-gray-300 ${
                                            embedLLM 
                                                ? 'top-2.5 text-xl font-normal text-gray-400' 
                                                : 'top-1/2 -translate-y-1/2 text-base font-thin text-gray-400'
                                        }`}>
                                            Embedding LLM
                                        </span>
                                        <span className={`absolute bottom-3 text-[15px] text-gray-500 transition-all duration-300 ease-out ${
                                            embedLLM 
                                                ? 'opacity-100 translate-y-0' 
                                                : 'opacity-0 translate-y-2'
                                        }`}>
                                            {embedLLM}
                                        </span>
                                        <select
                                            value={embedLLM}
                                            onChange={e => setEmbedLLM(e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
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
                                                Start RAG Chat
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

            {/* NEW: Passed systemPrompt props down */}
            <HistorySidebar
                conversations={conversations}
                activeId={activeConvId}
                onSelect={loadConversation}
                onDelete={handleDeleteConversation}
                onNewChat={handleNewChat}
                isOpen={historyOpen}
                onToggle={() => setHistoryOpen(o => !o)}
                uploadedFile={uploadedFile}
                systemPrompt={systemPrompt}
                setSystemPrompt={setSystemPrompt}
            />
        </div>
    );
}