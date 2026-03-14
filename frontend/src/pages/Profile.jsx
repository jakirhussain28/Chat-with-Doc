import React, { useState } from 'react';
import { IoTrashOutline } from 'react-icons/io5';

export default function Profile({ onClose }) {
    // Local state to manage form inputs based on the screenshot mockup
    const [mongoURI, setMongoURI] = useState('');
    const [ollamaURL, setOllamaURL] = useState('');

    // Managing lists of dynamic LLM entries
    const [genLLMs, setGenLLMs] = useState([{ id: 1, value: '' }]);
    const [embedLLMs, setEmbedLLMs] = useState([{ id: 1, value: '' }]);

    // Close the modal if clicking outside the main content box
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleAddGenLLM = () => {
        setGenLLMs([...genLLMs, { id: Date.now(), value: '' }]);
    };

    const handleAddEmbedLLM = () => {
        setEmbedLLMs([...embedLLMs, { id: Date.now(), value: '' }]);
    };

    const handleRemoveGenLLM = (idToRemove) => {
        setGenLLMs(genLLMs.filter(llm => llm.id !== idToRemove));
    };

    const handleRemoveEmbedLLM = (idToRemove) => {
        setEmbedLLMs(embedLLMs.filter(llm => llm.id !== idToRemove));
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-xs"
            onClick={handleBackdropClick}
        >
            <div className="bg-[#1a1b20] border border-[#3b4154] w-[750px] h-[600px] rounded-md p-8 shadow-2xl flex flex-col gap-8 text-gray-300 font-sans overflow-hidden">

                {/* Connection Settings */}
                <div className="flex flex-col gap-5">
                    <div className="flex items-center">
                        <label className="text-gray-400 font-medium w-48 shrink-0">MongoDB URI Local</label>
                        <input
                            type="text"
                            value={mongoURI}
                            onChange={(e) => setMongoURI(e.target.value)}
                            placeholder="value"
                            className="flex-1 bg-[#0a0a0a] border border-[#1f2025] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4b5563]"
                        />
                        <button className="ml-4 bg-[#21352b] text-[#5cb58a] hover:bg-[#2a4034] border border-[#2c4538] transition-colors px-4 py-1.5 rounded-md font-medium text-sm">
                            Done
                        </button>
                    </div>

                    <div className="flex items-center">
                        <label className="text-gray-400 font-medium w-48 shrink-0">Ollama URL Local</label>
                        <input
                            type="text"
                            value={ollamaURL}
                            onChange={(e) => setOllamaURL(e.target.value)}
                            placeholder="value"
                            className="flex-1 bg-[#0a0a0a] border border-[#1f2025] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4b5563]"
                        />
                        <button className="ml-4 bg-[#21352b] text-[#5cb58a] hover:bg-[#2a4034] border border-[#2c4538] transition-colors px-4 py-1.5 rounded-md font-medium text-sm">
                            Done
                        </button>
                    </div>
                </div>

                {/* Entries Section */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center gap-4 pb-4 mb-4 border-b border-[#3b4154]">
                        <h3 className="text-xl font-semibold text-gray-200 w-44">Entries</h3>
                        <button
                            onClick={handleAddGenLLM}
                            className="bg-[#21352b] text-[#5cb58a] hover:bg-[#2a4034] border border-[#2c4538] transition-colors px-4 py-1 rounded-md font-medium text-sm"
                        >
                            Add Gen LLM
                        </button>
                        <button
                            onClick={handleAddEmbedLLM}
                            className="bg-[#21352b] text-[#5cb58a] hover:bg-[#2a4034] border border-[#2c4538] transition-colors px-4 py-1 rounded-md font-medium text-sm"
                        >
                            Add Embed LLM
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {/* Gen LLM List */}
                        {genLLMs.map((llm, index) => (
                            <div key={`gen-${llm.id}`} className="flex items-center pl-4">
                                <label className="text-gray-400 text-sm w-40 shrink-0">Gen LLM</label>
                                <input
                                    type="text"
                                    value={llm.value}
                                    onChange={(e) => {
                                        const newLLMs = [...genLLMs];
                                        newLLMs[index].value = e.target.value;
                                        setGenLLMs(newLLMs);
                                    }}
                                    placeholder="value"
                                    className="flex-1 bg-[#0a0a0a] border border-[#1f2025] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4b5563]"
                                />
                                <button
                                    onClick={() => handleRemoveGenLLM(llm.id)}
                                    className="ml-4 bg-[#243144] text-[#6d93c7] border border-[#2d3d54] hover:text-red-400 hover:bg-[#2a3a50] transition-colors p-2 rounded-md"
                                >
                                    <IoTrashOutline className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        {/* Embed LLM List */}
                        {embedLLMs.map((llm, index) => (
                            <div key={`embed-${llm.id}`} className="flex items-center pl-4">
                                <label className="text-gray-400 text-sm w-40 shrink-0">Embed LLM</label>
                                <input
                                    type="text"
                                    value={llm.value}
                                    onChange={(e) => {
                                        const newLLMs = [...embedLLMs];
                                        newLLMs[index].value = e.target.value;
                                        setEmbedLLMs(newLLMs);
                                    }}
                                    placeholder="value"
                                    className="flex-1 bg-[#0a0a0a] border border-[#1f2025] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#4b5563]"
                                />
                                <button
                                    onClick={() => handleRemoveEmbedLLM(llm.id)}
                                    className="ml-4 bg-[#243144] text-[#6d93c7] border border-[#2d3d54] hover:text-red-400 hover:bg-[#2a3a50] transition-colors p-2 rounded-md"
                                >
                                    <IoTrashOutline className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}