import React, { useState } from 'react';
import { TbFileUploadFilled } from "react-icons/tb";

function LeftPane() {
    const [chunkSize, setChunkSize] = useState('');
    const [chunkOverlap, setChunkOverlap] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [temperature, setTemperature] = useState('0.7');
    const [topK, setTopK] = useState('50');
    const [topP, setTopP] = useState('0.9');
    const [maxTokens, setMaxTokens] = useState('2048');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [genLLM, setGenLLM] = useState('GPT-4o');
    const [embedLLM, setEmbedLLM] = useState('text-embedding-3');

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) setUploadedFile(file.name);
    };
    const handleFileClick = () => document.getElementById('file-input').click();
    const handleFileChange = (e) => {
        if (e.target.files[0]) setUploadedFile(e.target.files[0].name);
    };

    return (
        <div className="flex flex-col w-72 min-w-[272px] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700 bg-slate-800/60 backdrop-blur">
                <h1 className="text-base font-bold text-white tracking-widest uppercase">Chat with DOC</h1>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                {/* Upload Section */}
                <div className="p-4 border-b border-slate-700/60">
                    <input id="file-input" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.txt,.doc,.csv" />
                    <div
                        onClick={handleFileClick}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-5 cursor-pointer transition-all duration-200 
              ${isDragging
                                ? 'border-blue-400 bg-blue-500/10'
                                : 'border-slate-600 bg-slate-800/40 hover:border-blue-500 hover:bg-blue-500/5'}`}
                    >
                        <TbFileUploadFilled className="w-7 h-7 text-blue-400 mb-1" />
                        {uploadedFile ? (
                            <span className="text-xs text-green-400 font-medium text-center break-all px-1">{uploadedFile}</span>
                        ) : (
                            <>
                                <span className="text-sm font-semibold text-slate-200">Upload File</span>
                                <span className="text-xs text-slate-500">PDF, TEXT, DOC, CSV</span>
                            </>
                        )}
                    </div>

                    {/* Chunk Settings */}
                    <div className="mt-4 space-y-3">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Chunk Size</label>
                            <input
                                type="number"
                                value={chunkSize}
                                onChange={e => setChunkSize(e.target.value)}
                                placeholder="e.g. 512"
                                className="w-full bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition placeholder-slate-600 font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Chunk Overlap</label>
                            <input
                                type="number"
                                value={chunkOverlap}
                                onChange={e => setChunkOverlap(e.target.value)}
                                placeholder="e.g. 50"
                                className="w-full bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition placeholder-slate-600 font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* System Prompt */}
                <div className="p-4 border-b border-slate-700/60">
                    <label className="block text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">System Prompt</label>
                    <textarea
                        value={systemPrompt}
                        onChange={e => setSystemPrompt(e.target.value)}
                        placeholder="e.g. You are a helpful assistant..."
                        rows={4}
                        className="w-full bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition placeholder-slate-600 font-mono resize-none leading-relaxed"
                    />
                </div>

                {/* Generation Parameters */}
                <div className="p-4 border-b border-slate-700/60 space-y-3">
                    <label className="block text-xs text-slate-400 font-medium uppercase tracking-wider">Generation Params</label>

                    {[
                        { label: 'Temperature', value: temperature, set: setTemperature, min: 0, max: 2, step: 0.1 },
                        { label: 'Top K', value: topK, set: setTopK, min: 1, max: 200, step: 1 },
                        { label: 'Top p', value: topP, set: setTopP, min: 0, max: 1, step: 0.05 },
                    ].map(({ label, value, set, min, max, step }) => (
                        <div key={label}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-slate-400">{label}</span>
                                <span className="text-xs text-blue-400 font-mono font-semibold">{value}</span>
                            </div>
                            <input
                                type="range" min={min} max={max} step={step} value={value}
                                onChange={e => set(e.target.value)}
                                className="w-full h-1.5 rounded-full appearance-none bg-slate-700 accent-blue-500 cursor-pointer"
                            />
                        </div>
                    ))}

                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-medium">Max Tokens Limit</label>
                        <input
                            type="number"
                            value={maxTokens}
                            onChange={e => setMaxTokens(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition placeholder-slate-600 font-mono"
                        />
                    </div>
                </div>

                {/* LLM Model Selectors */}
                <div className="p-4 space-y-3">
                    <label className="block text-xs text-slate-400 font-medium uppercase tracking-wider">Model Selection</label>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Generation LLM</label>
                        <select
                            value={genLLM}
                            onChange={e => setGenLLM(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition font-mono cursor-pointer appearance-none"
                        >
                            {['GPT-4o', 'GPT-4o-mini', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Llama 3.1'].map(m => (
                                <option key={m} value={m} className="bg-slate-900">{m}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Embedding LLM</label>
                        <select
                            value={embedLLM}
                            onChange={e => setEmbedLLM(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition font-mono cursor-pointer appearance-none"
                        >
                            {['text-embedding-3', 'text-embedding-ada-002', 'voyage-3', 'nomic-embed'].map(m => (
                                <option key={m} value={m} className="bg-slate-900">{m}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LeftPane;
