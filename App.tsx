import React, { useState, useEffect, useCallback } from 'react';
import { PaperViewer } from './components/PaperViewer';
import { InsightPanel } from './components/InsightPanel';
import { InsightType, InsightResult, SelectionData } from './types';
import { generateInsight } from './services/geminiService';
import { Upload, BookOpen, Sparkles, Image as ImageIcon, Code, Presentation, Zap, Key } from 'lucide-react';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [insights, setInsights] = useState<InsightResult[]>([]);
  const [currentSelection, setCurrentSelection] = useState<SelectionData | null>(null);
  const [apiKeyVerified, setApiKeyVerified] = useState(false);
  
  // Resizable Sidebar State
  const [panelWidth, setPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeyVerified(hasKey);
      } else {
        // Fallback for local dev or if window.aistudio is missing
        setApiKeyVerified(true);
      }
    };
    checkApiKey();
  }, []);

  const handleApiKeySelection = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assuming success as per race condition handling instructions
      setApiKeyVerified(true);
    }
  };

  // Resize Handlers
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = document.body.clientWidth - e.clientX;
        // Constraint: Min 300px, Max 70% of screen
        if (newWidth >= 300 && newWidth <= document.body.clientWidth * 0.7) {
          setPanelWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setInsights([]); // Clear previous insights
      setCurrentSelection(null);
    }
  };

  const handleSelectionComplete = (data: SelectionData) => {
    setCurrentSelection(data);
  };

  const handleAction = async (type: InsightType) => {
    if (!currentSelection) return;

    const newInsight: InsightResult = {
      id: Date.now().toString(),
      type,
      content: '',
      isLoading: true,
      timestamp: Date.now(),
    };

    // Add to list immediately to show loading state
    setInsights((prev) => [...prev, newInsight]);
    // Note: We do NOT clear currentSelection here anymore. 
    // This keeps the menu open so the user can generate multiple artifacts (e.g., Code AND Slides) for the same selection.

    try {
      const result = await generateInsight(currentSelection.imageBase64, type);
      
      setInsights((prev) => 
        prev.map(i => i.id === newInsight.id ? { ...i, content: result, isLoading: false } : i)
      );
    } catch (error) {
       setInsights((prev) => 
        prev.map(i => i.id === newInsight.id ? { ...i, content: 'Error processing request.', isLoading: false } : i)
      );
    }
  };

  const removeInsight = (id: string) => {
    setInsights(prev => prev.filter(i => i.id !== id));
  };

  if (!apiKeyVerified) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="text-indigo-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Welcome to ArXiv Insight</h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            To access the advanced Gemini 3.0 models for image analysis and reasoning, please select a valid API Key with billing enabled.
          </p>
          
          <button 
            onClick={handleApiKeySelection}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200"
          >
            <Key size={20} />
            <span>Select API Key</span>
          </button>

          <p className="mt-6 text-xs text-slate-400">
            Requires a Google Cloud Project with billing enabled. <br/>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">View Billing Documentation</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-20 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <BookOpen className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">ArXiv Insight <span className="text-xs font-normal text-slate-500 ml-2 bg-slate-100 px-2 py-0.5 rounded-full">Powered by Gemini 3.0</span></h1>
        </div>
        
        <div>
          <label className="flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors shadow-sm">
            <Upload size={16} className="mr-2" />
            Upload Paper (PDF)
            <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left: PDF Viewer */}
        <div className="flex-1 relative flex flex-col min-w-0">
           <PaperViewer file={file} onSelectionComplete={handleSelectionComplete} />

           {/* Dynamic Action Menu */}
           {currentSelection && (
             <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-2xl border border-indigo-100 p-2 flex items-center space-x-2 animate-in slide-in-from-bottom-4 z-30">
                <span className="text-xs font-semibold text-slate-400 px-3">Ask Gemini:</span>
                
                <button onClick={() => handleAction(InsightType.EXPLAIN)} className="flex items-center space-x-1.5 px-3 py-2 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors text-xs font-medium">
                  <Sparkles size={14} /> <span>Explain</span>
                </button>
                
                <button onClick={() => handleAction(InsightType.INFOGRAPHIC)} className="flex items-center space-x-1.5 px-3 py-2 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors text-xs font-medium">
                  <ImageIcon size={14} /> <span>Infographic</span>
                </button>
                
                <button onClick={() => handleAction(InsightType.SLIDE)} className="flex items-center space-x-1.5 px-3 py-2 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors text-xs font-medium">
                  <Presentation size={14} /> <span>Slide</span>
                </button>

                <button onClick={() => handleAction(InsightType.CODE)} className="flex items-center space-x-1.5 px-3 py-2 rounded-full bg-green-50 hover:bg-green-100 text-green-700 transition-colors text-xs font-medium">
                  <Code size={14} /> <span>Code</span>
                </button>
                
                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                <button onClick={() => setCurrentSelection(null)} className="px-3 py-2 text-slate-400 hover:text-slate-600 text-xs font-medium">Cancel</button>
             </div>
           )}
        </div>

        {/* Resizer Handle */}
        <div
          className={`w-1 hover:w-1.5 cursor-col-resize hover:bg-indigo-500 transition-all z-20 flex-shrink-0 border-l border-slate-200 ${isResizing ? 'bg-indigo-500 w-1.5' : 'bg-slate-50'}`}
          onMouseDown={startResizing}
        />

        {/* Right: Insight Panel */}
        <div 
            style={{ width: panelWidth }}
            className="bg-slate-50 shadow-xl z-10 relative flex-shrink-0"
        >
          <InsightPanel insights={insights} onClose={removeInsight} />
        </div>
      </main>
    </div>
  );
};

export default App;