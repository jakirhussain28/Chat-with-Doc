import { IoAdd, IoTrashOutline } from 'react-icons/io5';
import { VscSettings } from "react-icons/vsc";

export default function HistorySidebar({ conversations, activeId, onSelect, onDelete, onNewChat, isOpen, onToggle }) {
    return (
        <div
            className={`h-full flex flex-col bg-secondary/70 backdrop-blur-sm text-[15px] border-l border-[#413c4b] overflow-hidden transition-[width,min-width] duration-300 ease-in-out ${isOpen ? 'w-[330px] min-w-[330px]' : 'w-[50px] min-w-[50px]'}`}
            onMouseEnter={() => !isOpen && onToggle()}
            onMouseLeave={() => isOpen && onToggle()}
        >
            {/* Inner wrapper — always 330px wide, clipped by parent overflow-hidden */}
            <div className="w-[330px] h-full flex flex-col">
                {/* Collapsed icon — visible only when collapsed */}
                <div className={`absolute top-0 left-0 w-[50px] h-[52px] flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <VscSettings className="w-6 h-6 text-gray-400" />
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
                            <li className="px-4 py-3 text-center text-gray-500 text-xs whitespace-nowrap">No Files Uploaded</li>
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
