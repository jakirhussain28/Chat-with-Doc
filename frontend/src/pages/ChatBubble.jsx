import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatBubble({ role, content, isTyping }) {
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
                    ? 'bg-[rgb(3,145,147)]/50 text-white rounded-tr-sm'
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
