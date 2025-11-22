import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

interface Props {
  content: string;
}

export const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  return (
    <div className="markdown-body text-slate-700 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({node, inline, className, children, ...props}: any) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline ? (
              <pre className="bg-slate-900 text-green-400 p-3 rounded-lg font-mono text-xs overflow-x-auto my-4 shadow-sm">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-xs border border-slate-200" {...props}>
                {children}
              </code>
            )
          },
          h1: ({node, ...props}) => <h1 className="text-xl font-bold text-slate-900 mt-6 mb-3 pb-2 border-b border-slate-100" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-lg font-bold text-slate-900 mt-5 mb-2" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-md font-bold text-slate-900 mt-4 mb-2" {...props} />,
          p: ({node, ...props}) => <p className="mb-3 text-sm" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-4 space-y-1 text-sm" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-4 space-y-1 text-sm" {...props} />,
          li: ({node, ...props}) => <li className="text-slate-700 pl-1" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-200 pl-4 italic text-slate-500 my-4 bg-slate-50 py-2 rounded-r" {...props} />,
          a: ({node, ...props}) => <a className="text-indigo-600 hover:underline" {...props} />,
          table: ({node, ...props}) => <div className="overflow-x-auto my-4 rounded-lg border border-slate-200"><table className="min-w-full text-sm divide-y divide-slate-200" {...props} /></div>,
          thead: ({node, ...props}) => <thead className="bg-slate-50" {...props} />,
          th: ({node, ...props}) => <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" {...props} />,
          tr: ({node, ...props}) => <tr className="even:bg-slate-50/50" {...props} />,
          td: ({node, ...props}) => <td className="px-4 py-2 whitespace-nowrap text-slate-700" {...props} />,
          hr: ({node, ...props}) => <hr className="my-6 border-slate-200" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};