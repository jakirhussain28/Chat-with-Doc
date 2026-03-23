import { useState, useEffect, useRef, useCallback } from 'react';
import { IoSend } from 'react-icons/io5';
import { CiChat1 } from "react-icons/ci";
import HistorySidebar from './Settings.jsx';
import ChatBubble from './ChatBubble.jsx';
import Sidebar from './Sidebar.jsx';
import Profile from './Profile.jsx';
import { sendChatMessage, fetchConversations, fetchConversation, deleteConversation, uploadDocument, updateSettings, fetchConfig } from '../api/chat';

export default function ChatMAX() {
    // ─── Dynamic Config State ────────────────────────────────────────────────
    const [llmConfig, setLlmConfig] = useState({ generation_llms: [], embedding_llms: [] });

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const data = await fetchConfig();
                setLlmConfig(data);
            } catch (error) {
                console.error("Failed to load LLM config:", error);
            }
        };
        loadConfig();
    }, []);

    // Sidebar & Profile State
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('isSidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('isSidebarOpen', JSON.stringify(isSidebarOpen));
    }, [isSidebarOpen]);

    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [activeConvId, setActiveConvId] = useState(null);
    const [historyOpen, setHistoryOpen] = useState(true);

    const [genLLM, setGenLLM] = useState(() => localStorage.getItem('genLLM') || '');
    const [embedLLM, setEmbedLLM] = useState(() => localStorage.getItem('embedLLM') || '');
    const [uploadedFiles, setUploadedFiles] = useState([]);

    const [systemPrompt, setSystemPrompt] = useState('You are a concise chat assistant.');
    const [preset, setPreset] = useState('Balanced'); // NEW
    const [temperature, setTemperature] = useState(0.7);
    const [topK, setTopK] = useState(40);
    const [retrievalK, setRetrievalK] = useState(5);
    const [historyK, setHistoryK] = useState(8); // NEW
    const [topP, setTopP] = useState(0.8);
    const [maxTokens, setMaxTokens] = useState('800');
    const [chunkSize, setChunkSize] = useState(512);
    const [chunkOverlap, setChunkOverlap] = useState(50);

    const [showLlmAlert, setShowLlmAlert] = useState(false);
    const [showEmbedAlert, setShowEmbedAlert] = useState(false);
    const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
    const [duplicateFileName, setDuplicateFileName] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (genLLM) localStorage.setItem('genLLM', genLLM);
    }, [genLLM]);

    useEffect(() => {
        if (embedLLM) localStorage.setItem('embedLLM', embedLLM);
    }, [embedLLM]);

    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);
    const isLoadingConv = useRef(false);
    const [placeholder] = useState("Ask questions about your document");

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [inputValue]);

    const loadConversations = useCallback(async () => {
        try {
            const data = await fetchConversations('default_user');
            setConversations(data);
        } catch (e) {
            console.error('Failed to load conversations:', e);
        }
    }, []);

    useEffect(() => { loadConversations(); }, [loadConversations]);

    // ─── Debounced auto-save settings to MongoDB ──────────────────────────
    useEffect(() => {
        if (!activeConvId || isLoadingConv.current) return;
        const timer = setTimeout(() => {
            updateSettings(activeConvId, {
                preset, // NEW
                system_prompt: systemPrompt,
                temperature,
                top_k: topK,
                retrieval_k: retrievalK,
                history_k: historyK, // NEW
                top_p: topP,
                max_tokens: parseInt(maxTokens, 10) || 800,
                chunk_size: parseInt(chunkSize, 10) || 512,
                chunk_overlap: parseInt(chunkOverlap, 10) || 50,
                uploaded_files: uploadedFiles,
                gen_llm: genLLM || null,
                embed_llm: embedLLM || null,
            }).catch(err => console.error('Failed to save settings:', err));
        }, 500);
        return () => clearTimeout(timer);
    }, [activeConvId, preset, systemPrompt, temperature, topK, retrievalK, historyK, topP, maxTokens, chunkSize, chunkOverlap, uploadedFiles, genLLM, embedLLM]);

    const loadConversation = async (convId) => {
        try {
            isLoadingConv.current = true;
            const conv = await fetchConversation(convId);
            setMessages(conv.messages || []);
            setActiveConvId(convId);

            const s = conv.settings || {};
            if (s.preset != null) setPreset(s.preset);
            else setPreset('Custom'); // Default to custom for old conversations
            if (s.system_prompt != null) setSystemPrompt(s.system_prompt);
            if (s.temperature != null) setTemperature(s.temperature);
            if (s.top_k != null) setTopK(s.top_k);
            if (s.retrieval_k != null) setRetrievalK(s.retrieval_k);
            if (s.history_k != null) setHistoryK(s.history_k); // NEW
            if (s.top_p != null) setTopP(s.top_p);
            if (s.max_tokens != null) setMaxTokens(String(s.max_tokens));
            if (s.chunk_size != null) setChunkSize(s.chunk_size);
            if (s.chunk_overlap != null) setChunkOverlap(s.chunk_overlap);
            setUploadedFiles(s.uploaded_files || (s.uploaded_file ? [s.uploaded_file] : []));
            if (s.gen_llm != null) setGenLLM(s.gen_llm);
            if (s.embed_llm != null) setEmbedLLM(s.embed_llm);
        } catch (e) {
            console.error('Failed to load conversation:', e);
        } finally {
            setTimeout(() => { isLoadingConv.current = false; }, 600);
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setActiveConvId(null);
        setInputValue('');
        setUploadedFiles([]);
        setSystemPrompt('You are a concise chat assistant.');
        setPreset('Balanced');
        setTemperature(0.7);
        setTopK(40);
        setRetrievalK(5);
        setHistoryK(8); // NEW
        setTopP(0.8);
        setMaxTokens('800');
        setChunkSize(512);
        setChunkOverlap(50);
    };

    const handleDeleteConversation = async (convId) => {
        try {
            await deleteConversation(convId);
            if (activeConvId === convId) handleNewChat();
            loadConversations();
        } catch (e) {
            console.error('Failed to delete conversation:', e);
        }
    };

    const handleFileClick = () => document.getElementById('chat-file-input')?.click();

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            if (uploadedFiles.includes(file.name)) {
                setDuplicateFileName(file.name);
                setShowDuplicateAlert(true);
                setTimeout(() => setShowDuplicateAlert(false), 3000);
                e.target.value = null;
                return;
            }

            if (!embedLLM) {
                setShowEmbedAlert(true);
                setTimeout(() => setShowEmbedAlert(false), 3000);
                e.target.value = null;
                return;
            }

            setIsUploading(true);
            try {
                const res = await uploadDocument(file, activeConvId, chunkSize, chunkOverlap, embedLLM);
                setUploadedFiles(prev => [...prev, file.name]);
                setHistoryOpen(true);

                if (res.conversation_id && !activeConvId) {
                    setActiveConvId(res.conversation_id);
                    loadConversations();
                }
            } catch (err) {
                console.error("Upload failed", err);
                alert("Failed to process document.");
            } finally {
                setIsUploading(false);
                e.target.value = null;
            }
        }
    };

    const handleSend = async () => {
        const trimmed = inputValue.trim();
        if (!trimmed || isStreaming) return;

        if (!genLLM) {
            setShowLlmAlert(true);
            setTimeout(() => setShowLlmAlert(false), 3000);
            return;
        }

        if (uploadedFiles.length > 0 && !embedLLM) {
            setShowEmbedAlert(true);
            setTimeout(() => setShowEmbedAlert(false), 3000);
            return;
        }

        const userMsg = { role: 'user', content: trimmed };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsStreaming(true);

        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            const options = {
                temperature: temperature,
                top_k: topK,
                retrieval_k: retrievalK,
                history_k: historyK, // NEW
                top_p: topP,
                max_tokens: parseInt(maxTokens, 10) || 800
            };

            const response = await sendChatMessage(
                trimmed, 'default_user', activeConvId, genLLM, (uploadedFiles.length > 0 ? embedLLM : null), systemPrompt, options
            );
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
                    updated[updated.length - 1] = { ...last, content: 'Something went wrong. Please try again.' };
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

            {isProfileOpen && (
                <Profile onClose={() => setIsProfileOpen(false)} />
            )}

            <Sidebar
                isOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(o => !o)}
                conversations={conversations}
                activeId={activeConvId}
                onSelect={loadConversation}
                onDelete={handleDeleteConversation}
                onNewChat={handleNewChat}
                onOpenProfile={() => setIsProfileOpen(true)}
            />

            {showLlmAlert && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-grey-300/10 border border-amber-500/50 text-amber-600 px-5 py-2.5 rounded-lg shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-5 duration-300 pointer-events-none">
                    <span className="font-medium text-sm tracking-wide">Please select a Generation LLM</span>
                </div>
            )}

            {showEmbedAlert && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-grey-300/10 border border-amber-500/50 text-amber-600 px-5 py-2.5 rounded-lg shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-5 duration-300 pointer-events-none">
                    <span className="font-medium text-sm tracking-wide">Please select an Embedding LLM for RAG Chat</span>
                </div>
            )}

            {showDuplicateAlert && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-grey-300/10 border border-amber-500/50 text-amber-600 px-5 py-2.5 rounded-lg shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-5 duration-300 pointer-events-none">
                    <span className="font-medium text-sm tracking-wide">You already uploaded a file named {duplicateFileName}.</span>
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
                                    <div className="relative w-full h-[90px] bg-[#222222] hover:bg-[#2a2a2a] rounded-md flex items-center justify-center border border-gray-700/50 transition-colors shadow-sm cursor-pointer group overflow-hidden">
                                        <span className={`absolute transition-all duration-300 ease-out tracking-wide group-hover:text-gray-300 ${genLLM ? 'top-2.5 text-xl font-normal text-gray-400' : 'top-1/2 -translate-y-1/2 text-base font-thin text-gray-400'
                                            }`}>Generation LLM</span>
                                        <span className={`absolute bottom-3 text-[15px] text-gray-500 transition-all duration-300 ease-out ${genLLM ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                                            }`}>{genLLM}</span>
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

                                    <div className={`relative w-full h-[90px] rounded-md flex items-center justify-center border transition-colors shadow-sm overflow-hidden ${uploadedFiles.length > 0 ? 'bg-[#222222] border-gray-700/50 opacity-40 cursor-not-allowed' : 'bg-[#222222] hover:bg-[#2a2a2a] border-gray-700/50 cursor-pointer group'}`}>
                                        <span className={`absolute transition-all duration-300 ease-out tracking-wide group-hover:text-gray-300 ${embedLLM ? 'top-2.5 text-xl font-normal text-gray-400' : 'top-1/2 -translate-y-1/2 text-base font-thin text-gray-400'
                                            }`}>Embedding LLM</span>
                                        <span className={`absolute bottom-3 text-[15px] text-gray-500 transition-all duration-300 ease-out ${embedLLM ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                                            }`}>{embedLLM}</span>
                                        {uploadedFiles.length === 0 && (
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
                                        )}
                                    </div>
                                </div>

                                <div className="h-full">
                                    <input id="chat-file-input" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.txt,.doc,.docx,.csv" />
                                    <div
                                        onClick={handleFileClick}
                                        className={`relative w-full h-full rounded-md flex flex-col p-6 border transition-colors cursor-pointer group shadow-sm ${isUploading ? 'bg-slate-800 border-indigo-500/50 animate-pulse cursor-wait' : 'bg-[#222222] hover:bg-[#2a2a2a] border-gray-700/50'
                                            }`}
                                    >
                                        <div className="flex gap-4 items-start">
                                            <CiChat1 className="w-8 h-8 text-gray-500 -mt-0.5" />
                                            <span className="text-gray-400 font-medium text-lg leading-snug group-hover:text-gray-300 transition-colors">
                                                {isUploading ? 'Processing File...' : 'Start RAG Chat'}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-6 left-0 right-0 text-center">
                                            <span className="text-sm text-gray-500 font-thin tracking-wide">
                                                {uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s) attached` : 'Select PDF, Doc, Text, CSV'}
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
                                disabled={!inputValue.trim() || isStreaming || isUploading}
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                            >
                                <IoSend className="w-4.5 h-4.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <HistorySidebar
                conversations={conversations}
                activeId={activeConvId}
                onSelect={loadConversation}
                onDelete={handleDeleteConversation}
                onNewChat={handleNewChat}
                isOpen={historyOpen}
                onToggle={() => setHistoryOpen(o => !o)}
                uploadedFiles={uploadedFiles}
                systemPrompt={systemPrompt}
                setSystemPrompt={setSystemPrompt}
                preset={preset}
                setPreset={setPreset}
                temperature={temperature}
                setTemperature={setTemperature}
                topK={topK}
                setTopK={setTopK}
                retrievalK={retrievalK}
                setRetrievalK={setRetrievalK}
                historyK={historyK}           // NEW
                setHistoryK={setHistoryK}     // NEW
                topP={topP}
                setTopP={setTopP}
                maxTokens={maxTokens}
                setMaxTokens={setMaxTokens}
                chunkSize={chunkSize}
                setChunkSize={setChunkSize}
                chunkOverlap={chunkOverlap}
                setChunkOverlap={setChunkOverlap}
                genLLM={genLLM}
                setGenLLM={setGenLLM}
                generationLLMs={llmConfig.generation_llms}
            />
        </div>
    );
}