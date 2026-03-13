import React from 'react';
import { VscSettings } from "react-icons/vsc";

export default function HistorySidebar({
    conversations, activeId, onSelect, onDelete, onNewChat, isOpen, onToggle, uploadedFile,
    systemPrompt, setSystemPrompt,
    temperature, setTemperature,
    topK, setTopK,
    topP, setTopP,
    maxTokens, setMaxTokens,
    chunkSize, setChunkSize,
    chunkOverlap, setChunkOverlap,
    genLLM, setGenLLM, generationLLMs
}) {
    return (
        <div
            className={`h-full flex flex-col bg-secondary/70 backdrop-blur-sm text-[15px] border-l border-[#413c4b] overflow-hidden transition-[width,min-width] duration-300 ease-in-out ${isOpen ? 'w-[330px] min-w-[330px]' : 'w-[50px] min-w-[50px]'}`}
            onMouseEnter={() => !isOpen && onToggle()}
            onMouseLeave={() => isOpen && onToggle()}
        >
            <div className="w-[330px] h-full flex flex-col">
                <div className={`absolute top-0 left-0 w-[50px] h-[52px] flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <VscSettings className="w-6 h-6 text-gray-400" />
                </div>

                <div className={`flex items-center justify-center pt-3 pb-2 px-3 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <span
                        className="px-4 py-3 text-center text-gray-500 text-xs whitespace-nowrap cursor-pointer hover:text-gray-300 transition-colors truncate max-w-full"
                        onClick={() => document.getElementById('chat-file-input')?.click()}
                    >
                        {uploadedFile || 'No File Uploaded'}
                    </span>
                </div>

                <div className={`h-[1px] bg-[rgb(65,60,75)] mx-[10px] mb-1 flex-shrink-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} />

                <div className={`flex-1 overflow-y-auto px-5 pt-3 pb-5 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>

                    <div className={`mb-4 ${uploadedFile ? 'opacity-40 pointer-events-none' : ''}`}>
                        <label className="block text-[#8ba0af] text-[13px] mb-1.5 font-mono">Chunk Size</label>
                        <input
                            type="text"
                            placeholder="512"
                            value={chunkSize}
                            onChange={(e) => setChunkSize(e.target.value)}
                            disabled={!!uploadedFile}
                            className="w-full bg-[rgba(30,35,45,0.4)] border border-[#3b4154] rounded-lg px-3 py-2 text-sm text-gray-300 font-mono placeholder-[#526071] focus:outline-none focus:border-[#4b5563] disabled:cursor-not-allowed"
                        />
                    </div>

                    <div className={`mb-6 ${uploadedFile ? 'opacity-40 pointer-events-none' : ''}`}>
                        <label className="block text-[#8ba0af] text-[13px] mb-1.5 font-mono">Chunk Overlap</label>
                        <input
                            type="text"
                            placeholder="50"
                            value={chunkOverlap}
                            onChange={(e) => setChunkOverlap(e.target.value)}
                            disabled={!!uploadedFile}
                            className="w-full bg-[rgba(30,35,45,0.4)] border border-[#3b4154] rounded-lg px-3 py-2 text-sm text-gray-300 font-mono placeholder-[#526071] focus:outline-none focus:border-[#4b5563] disabled:cursor-not-allowed"
                        />
                    </div>

                    <div className="h-[1px] bg-[#2a303f] mb-4 w-[calc(100%+40px)] -ml-5" />

                    <div className="mb-4">
                        <label className="block text-[#8ba0af] text-[13px] tracking-wider mb-2 font-mono">SYSTEM PROMPT</label>
                        <textarea
                            placeholder="e.g. You are a helpful assistant..."
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            className="w-full h-24 bg-[rgba(30,35,45,0.4)] border border-[#3b4154] rounded-lg px-3 py-2 text-sm text-gray-300 font-mono placeholder-[#526071] focus:outline-none focus:border-[#4b5563] resize-none"
                        />
                    </div>

                    <div className="h-[1px] bg-[#2a303f] mb-4 w-[calc(100%+40px)] -ml-5" />

                    <div>
                        <label className="block text-[#8ba0af] text-[13px] tracking-wider mb-5 font-mono">GENERATION PARAMETERS</label>

                        <div className="mb-6 relative">
                            <div className="flex justify-between items-center mb-0">
                                <label className="text-[#8ba0af] text-[13px] font-mono">Temperature</label>
                                <span className="text-[rgb(3,145,147)] font-mono font-bold text-[13px]">{Number(temperature).toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="2" step="0.1"
                                value={temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                className="w-full h-0.5 bg-[#2a303f] rounded-lg appearance-none cursor-pointer accent-[rgb(3,145,147)] mt-3"
                                style={{ background: `linear-gradient(to right, rgba(3, 145, 147, 0.8) ${(temperature / 2) * 100}%, #2a303f ${(temperature / 2) * 100}%)` }}
                            />
                        </div>

                        <div className="mb-6 relative">
                            <div className="flex justify-between items-center mb-0">
                                <label className="text-[#8ba0af] text-[13px] font-mono">Top K</label>
                                <span className="text-[rgb(3,145,147)] font-mono font-bold text-[13px]">{topK}</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="20" step="1"
                                value={topK}
                                onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                                className="w-full h-0.5 bg-[#2a303f] rounded-lg appearance-none cursor-pointer accent-[rgb(3,145,147)] mt-3"
                                style={{ background: `linear-gradient(to right, rgba(3, 145, 147, 0.8) ${(topK / 20) * 100}%, #2a303f ${(topK / 100) * 100}%)` }}
                            />
                        </div>

                        <div className="mb-6 relative">
                            <div className="flex justify-between items-center mb-0">
                                <label className="text-[#8ba0af] text-[13px] font-mono">Top p</label>
                                <span className="text-[rgb(3,145,147)] font-mono font-bold text-[13px]">{Number(topP).toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="1" step="0.1"
                                value={topP}
                                onChange={(e) => setTopP(parseFloat(e.target.value))}
                                className="w-full h-0.5 bg-[#2a303f] rounded-lg appearance-none cursor-pointer accent-[rgb(3,145,147)] mt-3"
                                style={{ background: `linear-gradient(to right, rgba(3, 145, 147, 0.8) ${(topP / 1) * 100}%, #2a303f ${(topP / 1) * 100}%)` }}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-[#8ba0af] text-[13px] mb-2 font-mono">Max Tokens Limit</label>
                            <input
                                type="text"
                                value={maxTokens}
                                onChange={(e) => setMaxTokens(e.target.value)}
                                className="w-full bg-[rgba(30,35,45,0.4)] border border-[#3b4154] rounded-lg px-3 py-2 text-sm text-gray-300 font-mono placeholder-[#526071] focus:outline-none focus:border-[#4b5563]"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-[#8ba0af] text-[13px] mb-2 font-mono">Generation LLM</label>
                            <select
                                value={genLLM}
                                onChange={(e) => setGenLLM(e.target.value)}
                                className="w-full bg-[rgba(30,35,45,0.4)] border border-[#3b4154] rounded-lg px-3 py-2 text-sm text-gray-300 font-mono focus:outline-none focus:border-[#4b5563] cursor-pointer appearance-none"
                            >
                                <option value="" disabled>Select model</option>
                                {(generationLLMs || []).map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}