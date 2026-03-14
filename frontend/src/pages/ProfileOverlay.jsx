import React, { useState } from 'react';
import { IoTrashOutline } from 'react-icons/io5';

export default function ProfileOverlay({ isOpen, onClose }) {
  const [mongoUri, setMongoUri] = useState('value');
  const [showGenLlm, setShowGenLlm] = useState(true);
  const [showEmbedLlm, setShowEmbedLlm] = useState(true);
  const [genLlm, setGenLlm] = useState('value');
  const [embedLlm, setEmbedLlm] = useState('value');

  if (!isOpen) return null;

  // Reusable button styles
  const btnStyle = "bg-[#1b3a2a] hover:bg-[#224835] text-[#48c78e] px-4 py-1.5 rounded-md font-medium text-sm transition-colors border border-[#234c37] shrink-0";
  const inputStyle = "w-full bg-black border border-gray-800 rounded-md px-3 py-1.5 text-sm text-gray-400 focus:outline-none focus:border-gray-600";
  const labelStyle = "text-gray-400 font-medium text-sm whitespace-nowrap";
  const iconBtnStyle = "p-1.5 bg-[#252f3e] hover:bg-[#2c384a] text-blue-400 rounded-md transition-colors shrink-0";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Content Container */}
      <div className="relative w-[600px] bg-[#1a1b1e] border border-gray-700/50 rounded-lg shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
        
        {/* Top Section: MongoDB URI */}
        <div className="flex items-center gap-4 mb-8">
          <label className={`${labelStyle} w-[130px]`}>MongoDB URI Local</label>
          <div className="flex-1">
            <input 
              type="text"
              value={mongoUri}
              onChange={(e) => setMongoUri(e.target.value)}
              className={inputStyle}
            />
          </div>
          <button 
            onClick={onClose}
            className={btnStyle}
          >
            Done
          </button>
        </div>

        {/* Middle Section: Entries Header & Buttons */}
        <div className="flex items-center gap-4 mb-6">
          <h3 className="text-gray-200 font-semibold text-lg w-[130px]">Entries</h3>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowGenLlm(true)}
              className={btnStyle}
            >
              Add Gen LLM
            </button>
            <button 
              onClick={() => setShowEmbedLlm(true)}
              className={btnStyle}
            >
              Add Embed LLM
            </button>
          </div>
        </div>

        {/* Bottom Section: LLM Inputs */}
        <div className="space-y-4">
          
          {/* Gen LLM Row */}
          {showGenLlm && (
            <div className="flex items-center gap-4">
              <label className={`${labelStyle} w-[130px]`}>Gen LLM</label>
              <div className="flex-1">
                <input 
                  type="text"
                  value={genLlm}
                  onChange={(e) => setGenLlm(e.target.value)}
                  className={inputStyle}
                />
              </div>
              <button 
                onClick={() => setShowGenLlm(false)}
                className={iconBtnStyle}
              >
                <IoTrashOutline className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Embed LLM Row */}
          {showEmbedLlm && (
            <div className="flex items-center gap-4">
              <label className={`${labelStyle} w-[130px]`}>Embed LLM</label>
              <div className="flex-1">
                <input 
                  type="text"
                  value={embedLlm}
                  onChange={(e) => setEmbedLlm(e.target.value)}
                  className={inputStyle}
                />
              </div>
              <button 
                onClick={() => setShowEmbedLlm(false)}
                className={iconBtnStyle}
              >
                <IoTrashOutline className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
