import React from 'react';
import { InsightResult, InsightType } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Spinner } from './Spinner';
import { Bot, Image as ImageIcon, FileText, Code, X, Download } from 'lucide-react';

interface Props {
  insights: InsightResult[];
  onClose: (id: string) => void;
}

export const InsightPanel: React.FC<Props> = ({ insights, onClose }) => {
  const downloadInsight = (insight: InsightResult) => {
    if (!insight.content || insight.isLoading) return;

    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];

    if (insight.type === InsightType.INFOGRAPHIC && insight.content.startsWith('data:image')) {
      link.href = insight.content;
      link.download = `infographic-${insight.id}-${timestamp}.png`;
    } else {
      const blob = new Blob([insight.content], { type: 'text/markdown' });
      link.href = URL.createObjectURL(blob);
      link.download = `${insight.type.toLowerCase().replace(/\s+/g, '-')}-${insight.id}-${timestamp}.md`;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (link.href.startsWith('blob:')) {
        URL.revokeObjectURL(link.href);
    }
  };

  if (insights.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
        <Bot size={48} className="mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">AI Research Assistant</h3>
        <p className="text-sm">Highlight any text, table, figure, or equation in the paper to get instant explanations, code, or visualizations from Gemini 3.0.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6 bg-slate-50">
      {insights.slice().reverse().map((insight) => (
        <div key={insight.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right-4 duration-300">
          {/* Header */}
          <div className="bg-slate-50 border-b border-slate-100 p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
               {insight.type === InsightType.EXPLAIN && <Bot size={16} className="text-blue-500" />}
               {insight.type === InsightType.INFOGRAPHIC && <ImageIcon size={16} className="text-purple-500" />}
               {insight.type === InsightType.SLIDE && <FileText size={16} className="text-orange-500" />}
               {insight.type === InsightType.CODE && <Code size={16} className="text-green-500" />}
               <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{insight.type}</span>
            </div>
            <div className="flex items-center space-x-1">
                {!insight.isLoading && (
                  <button 
                    onClick={() => downloadInsight(insight)} 
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors rounded-md"
                    title="Download Artifact"
                  >
                    <Download size={14} />
                  </button>
                )}
                <button 
                  onClick={() => onClose(insight.id)} 
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-md"
                  title="Close"
                >
                  <X size={14} />
                </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4">
            {insight.isLoading ? (
               <div className="flex items-center space-x-3 text-slate-500 py-4">
                  <Spinner className="text-indigo-500" />
                  <span className="text-sm animate-pulse">Thinking...</span>
               </div>
            ) : (
               <>
                 {insight.type === InsightType.INFOGRAPHIC && insight.content.startsWith('data:image') ? (
                   <div className="rounded-lg overflow-hidden border border-slate-100">
                      <img src={insight.content} alt="Generated Infographic" className="w-full h-auto" />
                   </div>
                 ) : (
                   <MarkdownRenderer content={insight.content} />
                 )}
               </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
