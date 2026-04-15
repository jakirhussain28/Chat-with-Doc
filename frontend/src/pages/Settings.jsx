import React, { useState } from 'react';
import { VscSettings } from "react-icons/vsc";
import { GoSidebarExpand } from "react-icons/go";
import { GiSettingsKnobs } from "react-icons/gi";

export const PRESETS = {
    "Precise": { temperature: 0.2, topP: 0.5, topK: 10, historyK: 4, retrievalK: 3 },
    // "Balanced": { temperature: 0.7, topP: 0.8, topK: 40, historyK: 6, retrievalK: 10 },
    "Creative": { temperature: 0.9, topP: 0.95, topK: 60, historyK: 10, retrievalK: 7 },
    "Max Content": { temperature: 0.7, topP: 0.8, topK: 40, historyK: 8, retrievalK: 20 },
    "Custom": {}
};

export default function HistorySidebar({
    conversations, activeId, onSelect, onDelete, onNewChat, isOpen, onToggle, uploadedFiles,
    systemPrompt, setSystemPrompt,
    preset, setPreset, // NEW
    temperature, setTemperature,
    topK, setTopK,
    retrievalK, setRetrievalK,
    historyK, setHistoryK, // NEW
    topP, setTopP,
    maxTokens, setMaxTokens,
    chunkSize, setChunkSize,
    chunkOverlap, setChunkOverlap,
    genLLM, setGenLLM, generationLLMs
}) {
    const [isPinned, setIsPinned] = useState(false);

    const handlePresetChange = (e) => {
        const p = e.target.value;
        setPreset(p);
        if (p !== "Custom" && PRESETS[p]) {
            const vals = PRESETS[p];
            if (vals.temperature !== undefined) setTemperature(vals.temperature);
            if (vals.topP !== undefined) setTopP(vals.topP);
            if (vals.topK !== undefined) setTopK(vals.topK);
            if (vals.historyK !== undefined) setHistoryK(vals.historyK);
            if (vals.retrievalK !== undefined) setRetrievalK(vals.retrievalK);
        }
    };

    return (
        <div
            className={`h-full flex flex-col bg-secondary/70 backdrop-blur-sm text-[15px] border-l border-[#413c4b] overflow-hidden transition-[width,min-width] duration-300 ease-in-out ${isOpen || isPinned ? 'w-[330px] min-w-[330px]' : 'w-[50px] min-w-[50px]'}`}
            onMouseEnter={() => !isOpen && !isPinned && onToggle()}
            onMouseLeave={() => isOpen && !isPinned && onToggle()}
        >
            <div className="w-[330px] h-full flex flex-col">
                <div className={`absolute top-0 left-0 w-[50px] h-[52px] flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <VscSettings className="w-6 h-6 text-gray-400" />
                </div>

                <div className={`flex items-center pt-3 pb-2 px-3 transition-opacity duration-300 ${isOpen || isPinned ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center -ml-1">
                        <GoSidebarExpand
                            className={`w-5 h-5 cursor-pointer transition-all duration-300 ${isPinned ? 'text-[rgb(3,145,147)]' : 'text-gray-400 hover:text-gray-400 opacity-100 hover:opacity-100'}`}
                            onClick={() => setIsPinned(!isPinned)}
                        />
                    </div>
                    <span
                        className="px-4 py-2 text-center text-gray-500 text-xs whitespace-nowrap cursor-pointer hover:text-gray-300 transition-colors max-w-full flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden inline-block"
                        title={uploadedFiles?.join('\n')}
                        onClick={() => document.getElementById('chat-file-input')?.click()}
                    >
                        {uploadedFiles?.length > 0 ? uploadedFiles.join('\u2003') : 'No File Selected'}
                    </span>
                </div>

                <div className={`h-[1px] bg-[rgb(65,60,75)] mx-[10px] mb-1 flex-shrink-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} />

                <div className={`flex-1  overflow-y-auto overflow-x-hidden px-5 pt-3 pb-5 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>

                    <div className={`flex items-center gap-4 mb-4 ${uploadedFiles?.length > 0 ? 'opacity-40 pointer-events-none' : ''}`}>
                        <div className="flex-1">
                            <label className="block text-[#8ba0af] text-[12px] mb-1.5 font-mono whitespace-nowrap">Chunk Size</label>
                            <input
                                type="text"
                                placeholder="1024"
                                value={chunkSize}
                                onChange={(e) => setChunkSize(e.target.value)}
                                disabled={uploadedFiles?.length > 0}
                                className="w-full bg-[rgba(30,35,45,0.4)] border border-[#3b4154] rounded-lg px-3 py-2 text-sm text-gray-300 font-mono placeholder-[#526071] focus:outline-none focus:border-[#4b5563] disabled:cursor-not-allowed text-center"
                            />
                        </div>

                        <div className="w-[1px] h-10 bg-[#2a303f] self-end mb-2" />

                        <div className="flex-1">
                            <label className="block text-[#8ba0af] text-[12px] mb-1.5 font-mono whitespace-nowrap">Chunk Overlap</label>
                            <input
                                type="text"
                                placeholder="50"
                                value={chunkOverlap}
                                onChange={(e) => setChunkOverlap(e.target.value)}
                                disabled={uploadedFiles?.length > 0}
                                className="w-full bg-[rgba(30,35,45,0.4)] border border-[#3b4154] rounded-lg px-3 py-2 text-sm text-gray-300 font-mono placeholder-[#526071] focus:outline-none focus:border-[#4b5563] disabled:cursor-not-allowed text-center"
                            />
                        </div>
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
                        <div className="flex justify-between items-center mb-5">
                            <label className="text-[#8ba0af] text-[13px] tracking-wider font-mono m-0">GENERATION PARAMETERS</label>
                            <select
                                value={preset}
                                onChange={handlePresetChange}
                                className="bg-[rgba(30,35,45,0.4)] border border-[#3b4154] text-[#8ba0af] rounded px-0.5 py-0.5 text-[11px] font-mono outline-none cursor-pointer"
                            >
                                {Object.keys(PRESETS).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        <div className="mb-4 relative">
                            <div className="flex justify-between items-center mb-0">
                                <label className="text-[#8ba0af] text-[13px] font-mono">Temperature</label>
                                <span className="text-[rgb(3,145,147)] font-mono font-bold text-[13px]">{Number(temperature).toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="2" step="0.1"
                                value={temperature}
                                onChange={(e) => { setTemperature(parseFloat(e.target.value)); if (preset !== 'Custom') setPreset('Custom'); }}
                                className="w-full h-0.5 bg-[#2a303f] rounded-lg appearance-none cursor-pointer accent-[rgb(3,145,147)] mt-3"
                                style={{ background: `linear-gradient(to right, rgba(3, 145, 147, 0.8) ${(temperature / 2) * 100}%, #2a303f ${(temperature / 2) * 100}%)` }}
                            />
                        </div>

                        <div className="mb-4 relative">
                            <div className="flex justify-between items-center mb-0">
                                <div className="flex items-baseline gap-2">
                                    <label className="text-[#8ba0af] text-[13px] font-mono">Retrieval K (RAG)</label>
                                    <p className="text-[9px] text-gray-500 font-mono">Chunks fetched from DB</p>
                                </div>
                                <span className="text-[rgb(3,145,147)] font-mono font-bold text-[13px]">{retrievalK}</span>
                            </div>
                            <input
                                type="range"
                                min="1" max="20" step="1"
                                value={retrievalK}
                                onChange={(e) => { setRetrievalK(parseInt(e.target.value, 10)); if (preset !== 'Custom') setPreset('Custom'); }}
                                className="w-full h-0.5 bg-[#2a303f] rounded-lg appearance-none cursor-pointer accent-[rgb(3,145,147)] mt-2"
                                style={{ background: `linear-gradient(to right, rgba(3, 145, 147, 0.8) ${(retrievalK / 20) * 100}%, #2a303f ${(retrievalK / 20) * 100}%)` }}
                            />
                        </div>

                        {/* NEW: History K Slider */}
                        <div className="mb-4 relative">
                            <div className="flex justify-between items-center mb-0">
                                <div className="flex items-baseline gap-2">
                                    <label className="text-[#8ba0af] text-[13px] font-mono">History (Messages)</label>
                                    <p className="text-[9px] text-gray-500 font-mono">Past chat context</p>
                                </div>
                                <span className="text-[rgb(3,145,147)] font-mono font-bold text-[13px]">{historyK}</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="50" step="2"
                                value={historyK}
                                onChange={(e) => { setHistoryK(parseInt(e.target.value, 10)); if (preset !== 'Custom') setPreset('Custom'); }}
                                className="w-full h-0.5 bg-[#2a303f] rounded-lg appearance-none cursor-pointer accent-[rgb(3,145,147)] mt-2"
                                style={{ background: `linear-gradient(to right, rgba(3, 145, 147, 0.8) ${(historyK / 50) * 100}%, #2a303f ${(historyK / 50) * 100}%)` }}
                            />
                        </div>

                        <div className="mb-4 relative">
                            <div className="flex justify-between items-center mb-0">
                                <div className="flex items-baseline gap-2">
                                    <label className="text-[#8ba0af] text-[13px] font-mono">Top K (Gen)</label>
                                    <p className="text-[9px] text-gray-500 font-mono">Token sampling diversity</p>
                                </div>
                                <span className="text-[rgb(3,145,147)] font-mono font-bold text-[13px]">{topK}</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="100" step="1"
                                value={topK}
                                onChange={(e) => { setTopK(parseInt(e.target.value, 10)); if (preset !== 'Custom') setPreset('Custom'); }}
                                className="w-full h-0.5 bg-[#2a303f] rounded-lg appearance-none cursor-pointer accent-[rgb(3,145,147)] mt-2"
                                style={{ background: `linear-gradient(to right, rgba(3, 145, 147, 0.8) ${(topK / 100) * 100}%, #2a303f ${(topK / 100) * 100}%)` }}
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
                                onChange={(e) => { setTopP(parseFloat(e.target.value)); if (preset !== 'Custom') setPreset('Custom'); }}
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